const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PERMISSION_STRINGS = {
  en: {
    NSPhotoLibraryUsageDescription: 'Allows access to your photo library to add images to your product catalog.',
    NSCameraUsageDescription: 'Allows using the camera to take photos of your catalog products.',
    NSUserNotificationsUsageDescription: 'Allows receiving daily reminders about pending orders and sales summaries to help manage your business.',
  },
  es: {
    NSPhotoLibraryUsageDescription: 'Permite acceder a tu biblioteca de fotos para agregar imágenes a los productos de tu catálogo.',
    NSCameraUsageDescription: 'Permite usar la cámara para tomar fotos de los productos de tu catálogo.',
    NSUserNotificationsUsageDescription: 'Permite recibir recordatorios diarios de pedidos pendientes y resúmenes de ventas para gestionar mejor tu negocio.',
  },
  pt: {
    NSPhotoLibraryUsageDescription: 'Permite acessar sua biblioteca de fotos para adicionar imagens aos produtos do seu catálogo.',
    NSCameraUsageDescription: 'Permite usar a câmera para tirar fotos dos produtos do seu catálogo.',
    NSUserNotificationsUsageDescription: 'Permite receber lembretes diários sobre pedidos pendentes e resumos de vendas para gerenciar melhor o seu negócio.',
  },
};

// Mapeo de código de idioma a nombre de carpeta que usa Xcode
const LOCALE_FOLDERS = { en: 'en', es: 'es', pt: 'pt-BR' };

function buildStringsFile(strings) {
  return Object.entries(strings)
    .map(([key, value]) => `"${key}" = "${value}";`)
    .join('\n');
}

module.exports = function withPermissionStrings(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const iosDir = path.join(cfg.modRequest.platformProjectRoot);

      for (const [lang, strings] of Object.entries(PERMISSION_STRINGS)) {
        const folder = LOCALE_FOLDERS[lang];
        const lprojDir = path.join(iosDir, `${folder}.lproj`);
        fs.mkdirSync(lprojDir, { recursive: true });
        fs.writeFileSync(
          path.join(lprojDir, 'InfoPlist.strings'),
          buildStringsFile(strings),
          'utf8'
        );
      }

      return cfg;
    },
  ]);
};
