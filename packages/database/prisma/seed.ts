import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'admin' },
    { name: 'owner' },
    { name: 'worker' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'owner' } });
  const workerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'worker' } });

  const password = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@aiwms.local',
      fullName: 'System Admin',
      roleId: adminRole.id,
    },
    {
      email: 'owner@aiwms.local',
      fullName: 'Business Owner',
      roleId: ownerRole.id,
    },
    {
      email: 'worker1@aiwms.local',
      fullName: 'Worker One',
      roleId: workerRole.id,
    },
    {
      email: 'worker2@aiwms.local',
      fullName: 'Worker Two',
      roleId: workerRole.id,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        roleId: user.roleId,
        passwordHash: password,
        isActive: true,
      },
      create: {
        ...user,
        passwordHash: password,
      },
    });
  }

  const owner = await prisma.user.findUniqueOrThrow({
    where: { email: 'owner@aiwms.local' },
  });
  const worker1 = await prisma.user.findUniqueOrThrow({
    where: { email: 'worker1@aiwms.local' },
  });
  const worker2 = await prisma.user.findUniqueOrThrow({
    where: { email: 'worker2@aiwms.local' },
  });

  const existingJobs = await prisma.job.count();
  if (existingJobs === 0) {
    await prisma.job.createMany({
      data: [
        {
          title: 'Envanter sayımı',
          description: 'A deposu stok sayımı',
          status: 'pending',
          createdById: owner.id,
          assignedToId: worker1.id,
        },
        {
          title: 'Aylık gider raporu',
          description: 'Mart ayı fişleri',
          status: 'in_progress',
          createdById: owner.id,
          assignedToId: worker2.id,
        },
        {
          title: 'Ekipman bakımı',
          description: 'Forklift #3 servisi',
          status: 'completed',
          createdById: owner.id,
          assignedToId: worker1.id,
        },
      ],
    });
  }

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const productA = await prisma.product.create({
      data: {
        name: 'Çelik Vida M8',
        sku: 'SKU-001',
        description: 'Paslanmaz çelik vida 8mm',
        unit: 'adet',
        quantityOnHand: 500,
        minStockLevel: 100,
      },
    });

    const productB = await prisma.product.create({
      data: {
        name: 'Ahşap Panel',
        sku: 'SKU-002',
        description: '18mm kontrplak panel',
        unit: 'm2',
        quantityOnHand: 45,
        minStockLevel: 50,
      },
    });

    await prisma.product.create({
      data: {
        name: 'Boya Kutusu',
        sku: 'SKU-003',
        description: '5L su bazlı boya',
        unit: 'kutu',
        quantityOnHand: 12,
        minStockLevel: 10,
      },
    });

    await prisma.stockTransaction.createMany({
      data: [
        {
          productId: productA.id,
          type: 'stock_in',
          quantity: 500,
          notes: 'Başlangıç stoku',
          createdById: owner.id,
        },
        {
          productId: productB.id,
          type: 'stock_in',
          quantity: 45,
          notes: 'Başlangıç stoku',
          createdById: owner.id,
        },
      ],
    });
  }

  const existingCustomers = await prisma.customer.count();
  if (existingCustomers === 0) {
    const customerAhmet = await prisma.customer.create({
      data: {
        name: 'Ahmet Yılmaz',
        phone: '05321234567',
        email: 'ahmet@ornek.com',
        notes: 'Servis müşterisi',
      },
    });

    const customerMehmet = await prisma.customer.create({
      data: {
        name: 'Mehmet Demir',
        phone: '05439876543',
        email: 'mehmet@ornek.com',
        notes: 'Bakım müşterisi',
      },
    });

    const jobs = await prisma.job.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
    if (jobs[0]) {
      await prisma.job.update({
        where: { id: jobs[0].id },
        data: { customerId: customerAhmet.id, title: 'Araç bakım ve teslim', status: 'completed' },
      });
    }
    if (jobs[1]) {
      await prisma.job.update({
        where: { id: jobs[1].id },
        data: { customerId: customerMehmet.id },
      });
    }

    const jobAhmet = jobs[0];
    const jobMehmet = jobs[1];

    await prisma.debt.create({
      data: {
        title: 'Servis ücreti',
        amount: 8500,
        paidAmount: 3000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        customerId: customerAhmet.id,
        jobId: jobAhmet?.id,
        createdById: owner.id,
        notes: 'Kalan bakım bedeli',
      },
    });

    await prisma.debt.create({
      data: {
        title: 'Gecikmiş fatura',
        amount: 4200,
        paidAmount: 0,
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        customerId: customerMehmet.id,
        jobId: jobMehmet?.id,
        createdById: owner.id,
      },
    });

    await prisma.expense.createMany({
      data: [
        {
          amount: 1500,
          description: 'Depo kira ödemesi',
          category: 'Kira',
          createdById: owner.id,
        },
        {
          amount: 650,
          description: 'Malzeme alımı',
          category: 'Malzeme',
          jobId: jobMehmet?.id,
          customerId: customerMehmet.id,
          createdById: owner.id,
        },
      ],
    });

    await prisma.income.createMany({
      data: [
        {
          amount: 3000,
          description: 'Peşin tahsilat',
          category: 'Tahsilat',
          customerId: customerAhmet.id,
          jobId: jobAhmet?.id,
          createdById: owner.id,
        },
        {
          amount: 5200,
          description: 'Tamamlanan iş geliri',
          category: 'Hizmet',
          createdById: owner.id,
        },
      ],
    });
  }

  const existingTemplates = await prisma.whatsappTemplate.count();
  if (existingTemplates === 0) {
    await prisma.whatsappTemplate.createMany({
      data: [
        {
          key: 'car_ready',
          name: 'Araç Teslim Hazır',
          locale: 'tr',
          body: 'Merhaba {{customerName}}, {{jobTitle}} işleminiz tamamlandı. Aracınız teslim edilmeye hazır. Bizi tercih ettiğiniz için teşekkür ederiz.',
        },
        {
          key: 'debt_reminder',
          name: 'Borç Hatırlatma',
          locale: 'tr',
          body: 'Sayın {{customerName}}, {{remainingAmount}} tutarında borcunuz bulunmaktadır. Son ödeme tarihi: {{dueDate}}. Bilgi için bize ulaşabilirsiniz.',
        },
        {
          key: 'car_ready',
          name: 'Vehicle Ready for Pickup',
          locale: 'en',
          body: 'Hello {{customerName}}, your {{jobTitle}} service is complete. Your vehicle is ready for pickup. Thank you for choosing us.',
        },
        {
          key: 'debt_reminder',
          name: 'Debt Reminder',
          locale: 'en',
          body: 'Dear {{customerName}}, you have an outstanding balance of {{remainingAmount}}. Due date: {{dueDate}}. Please contact us for details.',
        },
      ],
    });
  }

  console.log('Seed completed. Demo password for all users: password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
