import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { tokenSymbol, requiredAmount } = await request.json()

    if (!tokenSymbol || typeof requiredAmount !== 'number') {
      return NextResponse.json(
        { hasAccess: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const hasAccess = requiredAmount <= 100000

    return NextResponse.json({ hasAccess })
  } catch {
    return NextResponse.json(
      { hasAccess: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
