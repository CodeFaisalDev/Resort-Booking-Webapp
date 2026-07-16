import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ResortDetailsClient from '@/components/ResortDetailsClient';

export default async function ResortDetailPage({ params }: { params: Promise<{ resortId: string }> }) {
  const { resortId } = await params;

  // Query resort details
  const resort = await prisma.resort.findUnique({
    where: { id: resortId },
    include: {
      rooms: {
        include: {
          roomType: true
        }
      }
    }
  });

  if (!resort) {
    notFound();
  }

  // Fetch add-on services
  const services = await prisma.service.findMany();

  // Convert Decimal types from Prisma to fit standard JSON/JS structures
  const serializedResort = {
    ...resort,
    rooms: resort.rooms.map(room => ({
      ...room,
      roomType: {
        ...room.roomType,
        basePrice: room.roomType.basePrice.toString()
      }
    }))
  };

  const serializedServices = services.map(s => ({
    ...s,
    price: s.price.toString()
  }));

  return (
    <ResortDetailsClient 
      resort={serializedResort as any} 
      services={serializedServices as any} 
    />
  );
}
