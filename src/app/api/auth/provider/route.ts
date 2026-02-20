import { NextResponse } from 'next/server';
import { dbAccounts, getServerSession } from '@/utils/auth';

export async function GET() {
  const { user } = await getServerSession();

  if (!user) {
    return NextResponse.json({ providers: [] }, { status: 401 });
  }

  const getProviders = await dbAccounts.where('userId', '==', user.id).get();
  const providers = getProviders.docs.map((item) => {
    return {
      id: item.id,
      providerId: item.data().providerId,
      userId: item.data().userId,
    };
  });

  return NextResponse.json({ providers });
}
