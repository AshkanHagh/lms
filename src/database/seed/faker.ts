import { faker } from '@faker-js/faker';
import { db } from '..';
import {
  studentTable,
  courseTable,
  courseBenefitTable,
  courseChaptersTable,
  chapterVideosTable,
  courseTagsTable,
} from '../schema';
import {
  insertHashCache,
  insertHashListCache,
  insertSetListCache,
} from '../cache/index.cache';
import type { TSelectStudent } from '../../types/index.type';

const seedDatabase = async () => {
  console.log('seeding started');

  // Generate and insert students (only teachers)
  const students : TSelectStudent[] = Array.from({ length: faker.number.int({ min: 10, max: 20 }) }).map(() => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    plan: faker.helpers.arrayElement(['free']),
    role: 'teacher',  // All users are teachers
    image: faker.image.avatar(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }));

  await db.insert(studentTable).values(students).returning();

  // Generate and insert courses for each teacher
  for (const teacher of students) {
    const courses = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }).map(() => ({
      id: faker.string.uuid(),
      teacherId: teacher.id,
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      prerequisite: faker.lorem.sentence(),
      price: faker.commerce.price({ min: 50, max: 500 }),
      image: faker.image.url(),
      visibility: faker.helpers.arrayElement(['unpublish', 'publish']),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    }));

    await db.insert(courseTable).values(courses).returning();

    for (const course of courses) {
      await insertHashCache(`course:${course.id}`, course);

      // Generate and insert course benefits
      const benefits = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }).map(() => ({
        id: faker.string.uuid(),
        courseId: course.id,
        title: faker.lorem.words(3),
        details: faker.lorem.paragraph(),
      }));

      await db.insert(courseBenefitTable).values(benefits).returning();
      for (const benefit of benefits) {
        await insertSetListCache(`course_benefits:${course.id}`, JSON.stringify(benefit));
      }

      // Generate and insert course chapters
      const chapters = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }).map(() => ({
        id: faker.string.uuid(),
        courseId: course.id,
        title: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        visibility: faker.helpers.arrayElement(['draft', 'publish']),
      }));

      await db.insert(courseChaptersTable).values(chapters).returning();

      for (const chapter of chapters) {
        await insertHashCache(`course:${course.id}:chapters:${chapter.id}`, chapter);

        // Generate and insert chapter videos
        const videos = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }).map(() => ({
          id: faker.string.uuid(),
          chapterId: chapter.id,
          videoTitle: faker.lorem.words(3),
          videoUrl: faker.internet.url(),
          state: faker.helpers.arrayElement(['free', 'premium']),
        }));

        await db.insert(chapterVideosTable).values(videos).returning();

        for (const video of videos) {
          await insertHashListCache(`course_videos:${video.chapterId}`, video.id, video);
        }
      }
    }

    // Generate and insert course tags
    const tags = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }).map(() => ({
      id: faker.string.uuid(),
      courseId: courses[0].id,  // Assuming the first course
      tags: faker.lorem.word(),
    }));

    await db.insert(courseTagsTable).values(tags).returning();

    for (const tag of tags) {
      await insertHashListCache(`course_tags:${courses[0].id}`, tag.id, tag);
    }
  }

  console.log('seeding and caching completed');
};

seedDatabase().catch((err) => {
  console.error('Error seeding database:', err);
});
