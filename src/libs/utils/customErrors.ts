import type Stripe from 'stripe';
import ErrorHandler from './errorHandler';

class ValidationError extends ErrorHandler {
    constructor(message : string) {
        super(message, 400);
    }
}

class RouteNowFoundError extends ErrorHandler {
    constructor(message : string) {
        super(message, 404);
    }
}

class BadRequestError extends ErrorHandler {
    constructor(message : string = 'Bad request') {
        super(message, 400);
    }
}

class UnauthorizedError extends ErrorHandler {
    constructor(message : string = 'Unauthorized') {
        super(message, 401);
    }
}

class ForbiddenError extends ErrorHandler {
    constructor(message : string = 'Forbidden') {
        super(message, 403);
    }
}

class ResourceNotFoundError extends ErrorHandler {
    constructor(message : string = 'Resource not found') {
        super(message, 404);
    }
}

class CustomerIdNotFoundError extends ErrorHandler {
    constructor(message : string = 'CustomerId not found. you must subscribe to a plan to access this recourse') {
        super(message, 404);
    }
}

class SubscriptionNotFoundError extends ErrorHandler {
    constructor(message : string = 'Subscription not found. you must subscribe to a plan to access this recourse') {
        super(message, 404);
    }
}

class InvalidUserIdError extends ErrorHandler {
    constructor(message : string = 'Invalid id - User not found') {
        super(message, 400);
    }
}

class TokenRefreshError extends ErrorHandler {
    constructor(message : string = 'Could not refresh token') {
        super(message, 400);
    }
}

class LoginRequiredError extends ErrorHandler {
    constructor(message : string = 'Please login to access this resource') {
        super(message, 401);
    }
}

class AccessTokenInvalidError extends ErrorHandler {
    constructor(message : string = 'Access token is not valid') {
        super(message, 401);
    }
}

class InternalServerError extends ErrorHandler {
    constructor(message : string = 'Internal server error') {
        super(message, 500);
    }
}

class StudentNotFoundError extends ErrorHandler {
    constructor(message : string = 'User not found') {
        super(message, 404);
    }
}

class InvalidVerifyCode extends ErrorHandler {
    constructor(message : string = 'Invalid verify code') {
        super(message, 400)
    }
}

class EmailAlreadyExists extends ErrorHandler {
    constructor(message : string = 'Email or Username already exists') {
        super(message, 409);
    }
}

class InvalidEmailError extends ErrorHandler {
    constructor(message : string = 'Invalid email') {
        super(message, 401);
    }
}

class RoleForbiddenError extends ErrorHandler {
    constructor(role : string) {
        super(`Role : ${role} is not allowed to access this resource`, 403);
    }
}

class AlreadyPurchasedError extends ErrorHandler {
    constructor() {
        super('You have already purchased this item', 400);
    }
}

class NeedToPurchaseThisCourseError extends ErrorHandler {
    constructor() {
        super('You need to purchase this course', 400);
    }
}

class EventHandlingError extends ErrorHandler {
    constructor() {
        super('Error handling event', 400);
    }
}

class PaymentFailedError extends ErrorHandler {
    constructor(invoiceId : string, failure_message : string | Stripe.PaymentIntent | null) {
        super(`Payment failed for invoice ${invoiceId}: ${failure_message || 'Unknown reason'}. Please check the payment method and try again.`, 400);
    }
}

class CheckoutError extends ErrorHandler {
    constructor() {
        super('Could not create checkout session', 500);
    }
}

class RequestTimedOutError extends ErrorHandler {
    constructor() {
        super('Request timed out', 400);
    }
}


export {BadRequestError, UnauthorizedError, ForbiddenError, ResourceNotFoundError, InvalidUserIdError, LoginRequiredError, 
    InternalServerError, AccessTokenInvalidError, ValidationError, RoleForbiddenError, TokenRefreshError, RouteNowFoundError, 
    InvalidEmailError, EmailAlreadyExists, InvalidVerifyCode, StudentNotFoundError, AlreadyPurchasedError, NeedToPurchaseThisCourseError, 
    EventHandlingError, PaymentFailedError, CheckoutError, RequestTimedOutError, CustomerIdNotFoundError, SubscriptionNotFoundError
};