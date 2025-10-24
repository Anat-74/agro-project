export default [
  'strapi::logger',
   'strapi::errors',
   'strapi::security',
    {
    name: 'strapi::cors',
    config: {
      origin: ['*'], // Разрешить ВСЕ домены
      methods: ['GET'] // Разрешить только GET-запросы (для изображений)
    }
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];


//   {
//     name: 'strapi::cors',
//     config: {
//       origin: [
//         'https://vh324.by3020.ihb.by', // Ваш домен
//         'https://res.cloudinary.com'    // Cloudinary
//       ],
//       methods: ['GET']
//     }
//   },