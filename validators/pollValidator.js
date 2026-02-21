const { z } = require('zod');

const createPollSchema = z.object({
  body: z.object({
    question: z.string().min(5, 'Question must be at least 5 characters long'),
    options: z.union([
      z.string().min(1, 'Options cannot be empty'),
      z.array(z.string()).min(2, 'At least 2 options required'),
    ]),
  }),
});

const votePollSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid poll ID format'),
  }),
  body: z.object({
    optionId: z.string().regex(/^\d+$/, 'Option ID must be a number'),
  }),
});

module.exports = { createPollSchema, votePollSchema };
