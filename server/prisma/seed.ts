import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`

async function main() {
  await prisma.user.deleteMany({ where: { email: 'demo@menu.app' } })
  await prisma.user.create({
    data: {
      email: 'demo@menu.app',
      passwordHash: await bcrypt.hash('demo12345', 10),
      restaurant: {
        create: {
          slug: 'demo', name: 'Olive & Ember', nameAlt: 'زيتون وجمر',
          tagline: 'Wood-fired plates, made slowly', taglineAlt: 'أطباق على نار الحطب',
          accent: '#C2410C', currency: 'IQD', lang: 'en', altLang: 'ar',
          phone: '+964 750 000 0000', instagram: 'oliveandember',
          coverUrl: U('photo-1517248135467-4c7edcad34c4'),
          categories: {
            create: [
              { name: 'Starters', nameAlt: 'المقبلات', sort: 0, items: { create: [
                { name: 'Hummus & warm bread', nameAlt: 'حمص مع خبز ساخن', description: 'Silky chickpea purée, olive oil, paprika.', descriptionAlt: 'حمص ناعم مع زيت الزيتون والبابريكا.', price: 4500, tags: 'vegan', imageUrl: U('photo-1577805947697-89e18249d767'), sort: 0, featured: true },
                { name: 'Fattoush', nameAlt: 'فتوش', description: 'Crisp greens, sumac, pomegranate molasses.', descriptionAlt: 'خضار طازجة مع السماق ودبس الرمان.', price: 5000, tags: 'vegetarian,new', imageUrl: U('photo-1546069901-ba9599a7e63c'), sort: 1 },
              ] } },
              { name: 'Mains', nameAlt: 'الأطباق الرئيسية', sort: 1, items: { create: [
                { name: 'Charcoal lamb kebab', nameAlt: 'كباب لحم على الفحم', description: 'Hand-minced lamb, grilled tomato, flatbread.', descriptionAlt: 'لحم غنم مفروم يدوياً مع طماطم مشوية وخبز.', price: 14000, tags: 'spicy', imageUrl: U('photo-1555939594-58d7cb561ad1'), sort: 0, featured: true },
                { name: 'Margherita pizza', nameAlt: 'بيتزا مارغريتا', description: 'San Marzano tomato, mozzarella, basil.', descriptionAlt: 'طماطم سان مارزانو وموزاريلا وريحان.', price: 11000, tags: 'vegetarian', imageUrl: U('photo-1513104890138-7c749659a591'), sort: 1 },
                { name: 'Smoked burger', nameAlt: 'برغر مدخن', description: 'Beef patty, smoked cheddar, house sauce.', descriptionAlt: 'لحم بقري مع جبنة شيدر مدخنة وصوص خاص.', price: 12500, tags: '', imageUrl: U('photo-1568901346375-23c9450c58cd'), sort: 2, available: false },
              ] } },
              { name: 'Drinks', nameAlt: 'المشروبات', sort: 2, items: { create: [
                { name: 'Cardamom coffee', nameAlt: 'قهوة بالهيل', description: 'Slow-brewed with fresh cardamom.', descriptionAlt: 'قهوة مخمّرة ببطء مع هيل طازج.', price: 3000, tags: 'vegan', imageUrl: U('photo-1495474472287-4d71bcdd2085'), sort: 0 },
                { name: 'Fresh lemon & mint', nameAlt: 'ليمون ونعناع', description: 'Cold-pressed, lightly sweetened.', descriptionAlt: 'عصير طازج مع نعناع وسكر خفيف.', price: 3500, tags: 'vegan', sort: 1 },
              ] } },
            ],
          },
        },
      },
    },
  })
  console.log('Seeded → demo@menu.app / demo12345  ·  /r/demo')
}

main().finally(() => prisma.$disconnect())
