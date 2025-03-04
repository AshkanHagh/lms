import {
  getAllHashCache,
  insertHashCache,
  insertHashListCache,
  insertSetListCache,
} from "../database/cache/index.cache";
import {
  findPurchase,
  insertPurchase,
} from "../database/queries/checkout.query";
import { stripe } from "../configs/stripe.config";
import {
  AlreadyPurchasedError,
  BadRequestError,
  CheckoutError,
  CustomerIdNotFoundError,
  PaymentFailedError,
  ResourceNotFoundError,
  SubscriptionNotFoundError,
  StudentNotFoundError,
} from "../libs/utils";
import Stripe from "stripe";
import ErrorHandler from "../libs/utils/errorHandler";
import type {
  TErrorHandler,
  ModifiedPurchase,
  TSelectCourse,
  TSelectPurchases,
  PaymentIntent,
  TSelectStudent,
  TSelectSubscription,
} from "../types/index.type";
import {
  selectWithCondition,
  updateCustomerId,
  updateStudentPlan,
  handleSubscription,
  deleteSubscription,
  subscriptionDetail,
  updateSubscription,
} from "../database/queries/student.query";
import { emailEvent } from "../events/email.event";
import { findStudentWithEmailSearch } from "../database/cache/student.cache";

export const checkoutService = async (
  currentStudent: TSelectStudent,
  courseId: string,
): Promise<string | null> => {
  try {
    const isAlreadyPurchase: ModifiedPurchase | undefined = await findPurchase(
      courseId,
      currentStudent.id,
      "modified",
    );
    if (isAlreadyPurchase) throw new AlreadyPurchasedError();

    const desiredCourse: TSelectCourse = await getAllHashCache(
      `course:${courseId}`,
    );
    if (!desiredCourse) throw new ResourceNotFoundError();

    const paymentUrl: string | null = await createCheckoutSession(
      desiredCourse,
      currentStudent,
    );
    return paymentUrl;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const createCheckoutSession = async (
  desiredCourse: TSelectCourse,
  currentStudent: TSelectStudent,
): Promise<string | null> => {
  const customers = await stripe.customers.list({
    email: currentStudent.email,
  });

  const customer =
    customers.data.length > 0
      ? customers.data[0]
      : await stripe.customers.create({
          email: currentStudent.email,
          name: currentStudent.name!,
        });

  const checkoutSession: Stripe.Response<Stripe.Checkout.Session> =
    await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: desiredCourse.title,
              description: desiredCourse.description!,
              images: [desiredCourse.image!],
            },
            unit_amount: desiredCourse.price! * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.STRIPE_SUCCESS_URL}/verify?session_id={CHECKOUT_SESSION_ID}&course_id=${desiredCourse.id}&student_id=${currentStudent.id}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}/cancel`,
    });
  return checkoutSession.url;
};

export const verifyPaymentService = async (
  checkoutSessionId: string,
  courseId: string,
  currentStudentId: string,
): Promise<TSelectPurchases> => {
  try {
    const verifySessionId = await stripe.checkout.sessions.retrieve(
      checkoutSessionId,
      { expand: ["payment_intent.payment_method"] },
    );
    const session: PaymentIntent = verifySessionId as PaymentIntent;
    if (
      !verifySessionId ||
      !checkoutSessionId ||
      !courseId ||
      !currentStudentId
    ) {
      throw new BadRequestError();
    }

    if (verifySessionId.status !== "complete") throw new BadRequestError();

    const { brand, last4, exp_month, exp_year } =
      session.payment_intent?.payment_method.card ?? {};

    const { id } = session.payment_intent?.payment_method ?? {};

    const purchaseDetail = <Omit<TSelectPurchases, "id">>{
      brand,
      card: last4,
      expMonth: exp_month,
      expYear: exp_year,
      courseId,
      studentId: currentStudentId,
      paymentId: id,
    };

    const newPurchase: TSelectPurchases = await insertPurchase(purchaseDetail);
    await Promise.all([
      insertHashListCache(
        `student_purchases:${currentStudentId}`,
        courseId,
        newPurchase,
      ),
      insertSetListCache(`course_purchases:${courseId}`, currentStudentId),
    ]);

    return newPurchase;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const webhookListeningService = async (
  signature: string | undefined,
  body: string,
): Promise<string> => {
  try {
    if (!signature) throw new BadRequestError();

    const env = process.env;
    const webhookSecret =
      process.env.NODE_ENV === "production"
        ? env.STRIPE_WEBHOOK_SECRET_LIVE_ENV
        : env.STRIPE_WEBHOOK_SECRET_DEV_ENV;

    const { type, data } = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );

    switch (type) {
      case "checkout.session.completed": {
        await handleSubscriptionMode(
          data.object.mode,
          data.object.id,
          env.STRIPE_YEARLY_PRICE_ID,
        );
        break;
      }
      case "invoice.payment_failed": {
        const { id, lines, customer_email, payment_intent } = data.object;
        await handelPaymentFailed(
          id,
          lines.data,
          customer_email!,
          payment_intent,
          env.STRIPE_YEARLY_PRICE_ID,
        );
        break;
      }
      case "customer.subscription.updated": {
        const { customer, current_period_end, current_period_start, items } =
          data.object;

        await handleSubscriptionUpdate(
          customer as string,
          items.data.map((line) => line.price.id)[0],
          current_period_start,
          current_period_end,
          env.STRIPE_YEARLY_PRICE_ID,
        );
        break;
      }
      case "customer.subscription.deleted": {
        const { customer }: Stripe.Subscription = data.object;
        await handleSubscriptionDelete(customer as string);
        break;
      }
      default:
        break;
    }
    return "webhook receiver";
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

const handleSubscriptionMode = async (
  sessionMode: Stripe.Checkout.Session.Mode,
  sessionId: string,
  STRIPE_YEARLY_PRICE_ID: string,
): Promise<void> => {
  if (sessionMode === "subscription") {
    const { customer, customer_details, line_items } =
      await retrieveSessionDetails(sessionId);

    await handleSubscriptionCheckoutSession(
      customer as string,
      (customer_details as Stripe.Checkout.Session.CustomerDetails).email!,
      line_items?.data || [],
      STRIPE_YEARLY_PRICE_ID,
    );
  }
};

const retrieveSessionDetails = async (
  sessionId: string,
): Promise<Stripe.Response<Stripe.Checkout.Session>> => {
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer_details"],
  });
};

const handleSubscriptionCheckoutSession = async (
  customerId: string,
  customerEmail: string,
  lineItems: Stripe.InvoiceLineItem[] | Stripe.LineItem[],
  STRIPE_YEARLY_PRICE_ID: string,
): Promise<void> => {
  const currentStudentCache: TSelectStudent | undefined =
    await findStudentWithEmailSearch(customerEmail);

  const currentStudent: TSelectStudent | undefined = currentStudentCache
    ? currentStudentCache
    : await selectWithCondition(customerEmail, "fullData");

  if (!currentStudent) throw new StudentNotFoundError();

  // eslint-disable-next-line
  currentStudent?.customerId ||
    (await updateCustomerId(currentStudent.id, customerId));

  await insertHashCache<string>(`student:${currentStudent.id}`, {
    customerId: customerId,
  });

  for (const item of lineItems) {
    const priceId: string | undefined = item.price?.id;
    const endDate: Date = new Date();

    // eslint-disable-next-line
    priceId === STRIPE_YEARLY_PRICE_ID
      ? endDate.setFullYear(endDate.getFullYear() + 1)
      : endDate.setMonth(endDate.getMonth() + 1);

    const [subscriptionDetail, updatedStudentDetail] = await Promise.all([
      handleSubscription(currentStudent.id, {
        startDate: new Date(),
        endDate: endDate,
        plan: "premium",
        period: priceId === STRIPE_YEARLY_PRICE_ID ? "yearly" : "monthly",
      }),
      updateStudentPlan(currentStudent.id, "premium"),
    ]);

    await Promise.all([
      await insertHashCache(
        `student_subscription:${subscriptionDetail.studentId}`,
        subscriptionDetail,
      ),
      await insertHashCache(
        `student:${currentStudent.id}`,
        updatedStudentDetail,
      ),
    ]);
  }
};

const handelPaymentFailed = async (
  invoiceId: string,
  linesData: Stripe.InvoiceLineItem[],
  customerEmail: string,
  failure_message: string | Stripe.PaymentIntent | null,
  STRIPE_YEARLY_PRICE_ID: string,
): Promise<never> => {
  const currentStudentCache: TSelectStudent | undefined =
    await findStudentWithEmailSearch(customerEmail);

  const currentStudent: TSelectStudent | undefined = currentStudentCache
    ? currentStudentCache
    : await selectWithCondition(customerEmail, "fullData");

  if (!currentStudent) throw new StudentNotFoundError();

  const priceIds: (string | undefined)[] = linesData
    .map((line) => line.price?.id)
    .filter(Boolean);

  if (!priceIds[0]) {
    const paymentLink: string = `${process.env.STRIPE_BASE_URL}/`; // change later
    emailEvent.emit(
      "invoice.payment_failed",
      currentStudent.email,
      paymentLink,
      invoiceId,
    );
  }

  const planQuery =
    priceIds[0] === STRIPE_YEARLY_PRICE_ID ? "yearly" : "monthly";

  const paymentLink: string = `${process.env.STRIPE_BASE_URL}/api/v1/payments/subscription?plan=${planQuery}`;
  emailEvent.emit(
    "invoice.payment_failed",
    currentStudent.email,
    paymentLink,
    invoiceId,
  );
  throw new PaymentFailedError(invoiceId, failure_message);
};

const handleSubscriptionDelete = async (customerId: string): Promise<void> => {
  // if(!await stripe.subscriptions.retrieve(subscriptionId)) throw new BadRequestError();
  const { email } = (await stripe.customers.retrieve(
    customerId,
  )) as Stripe.Response<Stripe.Customer>;

  const currentStudentCache: TSelectStudent | undefined =
    await findStudentWithEmailSearch(email);

  const currentStudent: TSelectStudent | undefined = currentStudentCache
    ? currentStudentCache
    : await selectWithCondition(email!, "fullData");

  if (!currentStudent) throw new StudentNotFoundError();

  const subscriptionCache: TSelectSubscription = await getAllHashCache(
    `student_subscription:${currentStudent.id}`,
  );

  const currentSubscription: TSelectSubscription | undefined = subscriptionCache
    ? subscriptionCache
    : await subscriptionDetail(currentStudent.id);
  if (!currentSubscription) throw new SubscriptionNotFoundError();

  await deleteSubscription(currentStudent.id);
};

const handleSubscriptionUpdate = async (
  customerId: string,
  priceId: string,
  startDate: number,
  endDate: number,
  STRIPE_YEARLY_PRICE_ID: string,
): Promise<void> => {
  const { email } = (await stripe.customers.retrieve(
    customerId,
  )) as Stripe.Response<Stripe.Customer>;

  const currentStudentCache: TSelectStudent | undefined =
    await findStudentWithEmailSearch(email);

  const currentStudent: TSelectStudent | undefined = currentStudentCache
    ? currentStudentCache
    : await selectWithCondition(email!, "fullData");

  if (!currentStudent) throw new StudentNotFoundError();

  const currentSubscriptionCache: TSelectSubscription | undefined =
    await getAllHashCache(`student_subscription:${currentStudent.id}`);

  const currentSubscription: TSelectSubscription | undefined =
    currentSubscriptionCache
      ? currentSubscriptionCache
      : await subscriptionDetail(currentStudent.id);

  if (!currentSubscription) throw new SubscriptionNotFoundError();

  const period =
    priceId === STRIPE_YEARLY_PRICE_ID ? "yearly" : ("monthly" as const);

  const updatedStudentSubscription: TSelectSubscription =
    await updateSubscription(currentStudent.id, {
      period,
      endDate: new Date(endDate * 1000),
      startDate: new Date(startDate * 1000),
      plan: "premium",
    });

  if (updatedStudentSubscription) {
    await Promise.all([
      insertHashCache(
        `student_subscription:${currentStudent.id}`,
        updatedStudentSubscription,
      ),
      insertHashCache(`student:${currentStudent.id}`, { plan: "premium" }),
    ]);
  }
};

export const subscriptionCheckoutService = async (
  plan: "monthly" | "yearly",
  currentStudent: TSelectStudent,
): Promise<string | null> => {
  try {
    const { STRIPE_MONTHLY_PRICE_ID, STRIPE_YEARLY_PRICE_ID } = process.env;
    const priceId: string =
      plan === "yearly" ? STRIPE_YEARLY_PRICE_ID : STRIPE_MONTHLY_PRICE_ID;

    const customers: Stripe.Response<Stripe.ApiList<Stripe.Customer>> =
      await stripe.customers.list({
        email: currentStudent.email,
        limit: 1,
      });

    const customer: Stripe.Customer =
      customers.data.length > 0
        ? customers.data[0]
        : await stripe.customers.create({
            email: currentStudent.email,
            name: currentStudent.name!,
          });

    const checkoutSession: Stripe.Response<Stripe.Checkout.Session> =
      await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        customer: customer.id,
        success_url: process.env.STRIPE_BASE_URL,
        cancel_url: process.env.STRIPE_CANCEL_URL,
      });

    if (!checkoutSession.url) throw new CheckoutError();
    return checkoutSession.url;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const subscriptionPortalService = async (
  customerId: string | undefined,
): Promise<string | null> => {
  try {
    if (!customerId) throw new CustomerIdNotFoundError();

    const { STRIPE_BASE_URL } = process.env;
    const { url } = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: STRIPE_BASE_URL,
    });

    return url;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};
