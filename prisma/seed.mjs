import { PrismaClient, MasterDataType, MasterDataStatus } from '@prisma/client';

const prisma = new PrismaClient();

const masterData = {
  DEPARTMENT: ['AC', 'Accounting', 'HRD', 'IT', 'Maintenance'],
  RECRUITER: ['Azmi', 'Ayu Della', 'Zefry', 'Amel'],
  PIC: ['Abdul Ghofur', 'Agus Wiyanto'],
  REASON: ['Penambahan', 'Pergantian (EoC)', 'Pergantian (Mutasi)', 'Pergantian (Resign)', 'Lainnya'],
  SOURCE: ['Internal', 'Referal (ERP)', 'Job Street', 'Glints', 'Google form', 'Email', 'Web Internal', 'Eksternal Institusi Referal'],
};

async function main() {
  for (const [type, names] of Object.entries(masterData)) {
    for (const name of names) {
      await prisma.masterData.upsert({
        where: { type_name: { type: MasterDataType[type], name } },
        update: { status: MasterDataStatus.ACTIVE, deletedAt: null },
        create: { type: MasterDataType[type], name, status: MasterDataStatus.ACTIVE },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
