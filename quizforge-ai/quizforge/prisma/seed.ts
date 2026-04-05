// prisma/seed.ts
// Run: npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database…')

  // ── Demo user ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@quizforge.ai' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@quizforge.ai',
      passwordHash,
      role: 'STUDENT',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@quizforge.ai' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@quizforge.ai',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
    },
  })

  console.log('✅ Users created:', user.email, admin.email)

  // ── Sample question bank ─────────────────────────────────
  const bank = await prisma.questionBank.create({
    data: {
      title: 'Computer Networking Fundamentals',
      description: 'TCP/IP, HTTP, Databases, REST APIs',
      sourceType: 'manual',
      createdById: user.id,
    },
  })

  const questions = [
    {
      text: 'Which layer of the TCP/IP model is responsible for routing packets across networks?',
      type: 'MULTIPLE_CHOICE' as const,
      options: ['Application', 'Transport', 'Internet', 'Network Access'],
      correctAnswer: '2',
      explanation: 'The Internet layer handles IP addressing and routing between networks.',
      difficulty: 2,
    },
    {
      text: 'TCP provides reliable, ordered delivery of data packets.',
      type: 'TRUE_FALSE' as const,
      options: ['True', 'False'],
      correctAnswer: '0',
      explanation: 'TCP uses acknowledgments, sequence numbers, and retransmissions to guarantee reliable ordered delivery.',
      difficulty: 1,
    },
    {
      text: 'HTTP is stateless by design.',
      type: 'TRUE_FALSE' as const,
      options: ['True', 'False'],
      correctAnswer: '0',
      explanation: 'HTTP does not maintain state between requests — cookies and sessions are added on top to handle state.',
      difficulty: 1,
    },
    {
      text: 'Which HTTP method is used to create a new resource in a RESTful API?',
      type: 'MULTIPLE_CHOICE' as const,
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      correctAnswer: '1',
      explanation: 'POST is the standard HTTP method for creating new resources in REST APIs.',
      difficulty: 1,
    },
    {
      text: 'What does ACID stand for in database transactions?',
      type: 'MULTIPLE_CHOICE' as const,
      options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Identity, Data', 'Async, Compute, Indexing, Design', 'Application, Cache, Input, Delete'],
      correctAnswer: '0',
      explanation: 'ACID properties ensure reliable database transactions: Atomicity, Consistency, Isolation, Durability.',
      difficulty: 2,
    },
    {
      text: 'What are the four layers of the TCP/IP model?',
      type: 'SHORT_ANSWER' as const,
      options: null,
      correctAnswer: 'Application, Transport, Internet, Network Access',
      explanation: 'The TCP/IP stack has four layers: Application (HTTP/FTP), Transport (TCP/UDP), Internet (IP), and Network Access.',
      difficulty: 2,
    },
    {
      text: 'UDP guarantees packet delivery.',
      type: 'TRUE_FALSE' as const,
      options: ['True', 'False'],
      correctAnswer: '1',
      explanation: 'UDP is connectionless and does not guarantee delivery — it trades reliability for speed.',
      difficulty: 1,
    },
    {
      text: 'Which database type stores data as JSON-like documents?',
      type: 'MULTIPLE_CHOICE' as const,
      options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'],
      correctAnswer: '2',
      explanation: 'MongoDB is a document database that stores data in BSON (Binary JSON) format.',
      difficulty: 2,
    },
  ]

  await prisma.question.createMany({
    data: questions.map((q) => ({
      bankId: bank.id,
      text: q.text,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      aiGenerated: false,
    })),
  })

  // ── Create a sample test from the bank ───────────────────
  const allQuestions = await prisma.question.findMany({ where: { bankId: bank.id } })

  const test = await prisma.test.create({
    data: {
      bankId: bank.id,
      title: 'Computer Networking Quiz',
      description: 'A sample test covering TCP/IP, HTTP, and databases.',
      timeLimitSecs: 1200,
      passMark: 60,
      isPublished: true,
    },
  })

  await prisma.testQuestion.createMany({
    data: allQuestions.map((q, i) => ({
      testId: test.id,
      questionId: q.id,
      order: i,
    })),
  })

  console.log(`✅ Bank "${bank.title}" created with ${questions.length} questions`)
  console.log(`✅ Test "${test.title}" created`)
  console.log('')
  console.log('📋 Demo credentials:')
  console.log('   Email:    demo@quizforge.ai')
  console.log('   Password: password123')
  console.log('')
  console.log('   Admin email:    admin@quizforge.ai')
  console.log('   Admin password: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
