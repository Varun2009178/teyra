import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { File } from 'node:buffer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const serverClerk = clerkSecretKey
  ? createClerkClient({ secretKey: clerkSecretKey })
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!serverClerk) {
      console.error('❌ Missing CLERK_SECRET_KEY - cannot upload avatar');
      return NextResponse.json(
        { error: 'Clerk backend not configured' },
        { status: 500 }
      );
    }

    const { userId, imageBase64, mimeType } = await request.json().catch(() => ({}));

    if (!userId || !imageBase64) {
      return NextResponse.json(
        { error: 'userId and imageBase64 are required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const type = mimeType || 'image/jpeg';
    const extension = type.split('/').pop() || 'jpg';
    const file = new File([buffer], `avatar.${extension}`, { type });

    const updatedUser = await serverClerk.users.updateUserProfileImage(userId, {
      file,
    });

    return NextResponse.json(
      {
        success: true,
        imageUrl:
          updatedUser.imageUrl ||
          // @ts-expect-error - older Clerk SDKs use profileImageUrl or nested profileImage
          updatedUser.profileImageUrl ||
          updatedUser.profileImage?.url ||
          null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error updating iOS avatar:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile photo',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
