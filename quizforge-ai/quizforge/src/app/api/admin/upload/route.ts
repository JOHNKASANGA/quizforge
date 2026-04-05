// src/app/api/admin/upload/route.ts
// Accepts CSV or JSON file → validates rows → bulk inserts questions

import { NextRequest, NextResponse } from 'next/server'
import { parse as parseCsv } from 'papaparse'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Expected shape of each row in uploaded file
const QuestionRowSchema = z.object({
  text: z.string().min(3).max(1000),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
  options: z.string().optional(),       // JSON array string: '["A","B","C","D"]'
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3).default(2),
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bankTitle = (formData.get('bankTitle') as string) || 'Uploaded Bank'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const content = await file.text()
    const rawRows: unknown[] = []

    // ── Parse ─────────────────────────────────────────────
    if (fileName.endsWith('.csv')) {
      const result = parseCsv(content, { header: true, skipEmptyLines: true })
      rawRows.push(...result.data)
    } else if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(content)
      rawRows.push(...(Array.isArray(parsed) ? parsed : parsed.questions ?? []))
    } else {
      return NextResponse.json(
        { error: 'Only .csv and .json files are supported' },
        { status: 400 }
      )
    }

    // ── Validate ──────────────────────────────────────────
    const valid: z.infer<typeof QuestionRowSchema>[] = []
    const invalid: { row: number; issues: string }[] = []

    for (let i = 0; i < rawRows.length; i++) {
      const result = QuestionRowSchema.safeParse(rawRows[i])
      if (result.success) {
        valid.push(result.data)
      } else {
        invalid.push({ row: i + 1, issues: result.error.message })
      }
    }

    if (valid.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found in file', invalid },
        { status: 422 }
      )
    }

    // ── Create bank + bulk insert ─────────────────────────
    const bank = await prisma.questionBank.create({
      data: {
        title: bankTitle,
        sourceFile: file.name,
        sourceType: fileName.endsWith('.csv') ? 'csv' : 'json',
        createdById: 'system', // replace with session user
      },
    })

    const created = await prisma.$transaction(
      valid.map((row) =>
        prisma.question.create({
          data: {
            bankId: bank.id,
            text: row.text,
            type: row.type,
            options: row.options ? JSON.parse(row.options) : undefined,
            correctAnswer: row.correctAnswer,
            explanation: row.explanation ?? null,
            category: row.category ?? null,
            difficulty: row.difficulty,
            aiGenerated: false,
          },
        })
      )
    )

    return NextResponse.json(
      {
        data: {
          bankId: bank.id,
          inserted: created.length,
          invalidCount: invalid.length,
          invalid,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[csv-upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
