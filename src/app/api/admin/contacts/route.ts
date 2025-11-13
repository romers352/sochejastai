import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Contact extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    let query = 'SELECT * FROM contacts';
    let countQuery = 'SELECT COUNT(*) as total FROM contacts';
    const queryParams: any[] = [];
    const countParams: any[] = [];

    if (status && ['new', 'read', 'replied'].includes(status)) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      queryParams.push(status);
      countParams.push(status);
    }

    // Use string interpolation for LIMIT and OFFSET since they are validated integers
    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [contacts] = await db.execute<Contact[]>(query, queryParams);
    const [countResult] = await db.execute<RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}