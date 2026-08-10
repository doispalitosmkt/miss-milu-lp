<?php

declare(strict_types=1);

/**
 * Catálogo automático das galerias do portfólio.
 *
 * No servidor, este arquivo responde com JSON e varre as pastas a cada acesso.
 * No terminal, use `php assets/portfolio/catalogo.php --write` para atualizar o
 * fallback `catalogo.js`, usado quando a página é aberta sem suporte a PHP.
 */

$categoryIds = [
    '01-corporativo',
    '02-arquitetos',
    '03-confeitaria',
    '04-cestas-e-cafe',
    '05-fotografos',
    '06-padrinhos',
    '07-velas-e-saboaria',
    '08-casinhas',
    '09-datas-sazonais',
];

$allowedMimeTypes = [
    'webp' => ['image/webp'],
    'jpg' => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png' => ['image/png'],
];

$galleryDirectory = __DIR__ . '/carrossel';
$galleryUrl = 'assets/portfolio/carrossel';
$catalog = [
    'version' => '',
    'total' => 0,
    'categories' => [],
    'errors' => [],
];
$versionParts = [];

foreach ($categoryIds as $categoryId) {
    $categoryDirectory = $galleryDirectory . '/' . $categoryId;
    $images = [];

    if (!is_dir($categoryDirectory)) {
        $catalog['errors'][] = 'Pasta ausente: ' . $categoryId;
        $catalog['categories'][$categoryId] = [];
        continue;
    }

    $files = scandir($categoryDirectory);
    if ($files === false) {
        $catalog['errors'][] = 'Não foi possível ler: ' . $categoryId;
        $catalog['categories'][$categoryId] = [];
        continue;
    }

    foreach ($files as $fileName) {
        if ($fileName === '.' || $fileName === '..' || str_starts_with($fileName, '.')) {
            continue;
        }

        $absolutePath = $categoryDirectory . '/' . $fileName;
        if (!is_file($absolutePath)) {
            continue;
        }

        $extension = strtolower((string) pathinfo($fileName, PATHINFO_EXTENSION));
        if (!isset($allowedMimeTypes[$extension])) {
            continue;
        }

        $imageInfo = @getimagesize($absolutePath);
        $mimeType = is_array($imageInfo) && isset($imageInfo['mime'])
            ? strtolower((string) $imageInfo['mime'])
            : '';

        if (!is_array($imageInfo) || !in_array($mimeType, $allowedMimeTypes[$extension], true)) {
            $catalog['errors'][] = 'Imagem inválida ignorada: ' . $categoryId . '/' . $fileName;
            continue;
        }

        $contentHash = sha1_file($absolutePath);
        if ($contentHash === false) {
            $catalog['errors'][] = 'Não foi possível verificar: ' . $categoryId . '/' . $fileName;
            continue;
        }

        $shortHash = substr($contentHash, 0, 12);
        $fileSize = filesize($absolutePath);
        $encodedFileName = rawurlencode($fileName);
        $source = $galleryUrl
            . '/' . rawurlencode($categoryId)
            . '/' . $encodedFileName
            . '?v=' . $shortHash;

        $images[] = [
            'file' => $fileName,
            'src' => $source,
            'width' => (int) $imageInfo[0],
            'height' => (int) $imageInfo[1],
            'mime' => $mimeType,
            'bytes' => $fileSize === false ? 0 : (int) $fileSize,
        ];
        $versionParts[] = $categoryId . '/' . $fileName . ':' . $contentHash;
    }

    usort($images, static function (array $first, array $second): int {
        return strnatcasecmp($first['file'], $second['file']);
    });

    $catalog['categories'][$categoryId] = $images;
    $catalog['total'] += count($images);
}

$catalog['version'] = substr(hash('sha256', implode('|', $versionParts)), 0, 16);

$json = json_encode(
    $catalog,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
);

$fallbackPath = __DIR__ . '/catalogo.js';
$fallbackContents = 'window.MISS_MILU_PORTFOLIO_CATALOG = ' . $json . ";\n";
$arguments = PHP_SAPI === 'cli' ? ($argv ?? []) : [];

if (in_array('--write', $arguments, true)) {
    $temporaryPath = tempnam(__DIR__, '.catalogo-');
    if ($temporaryPath === false || file_put_contents($temporaryPath, $fallbackContents, LOCK_EX) === false) {
        fwrite(STDERR, "Não foi possível gerar catalogo.js.\n");
        exit(1);
    }

    if (!rename($temporaryPath, $fallbackPath)) {
        @unlink($temporaryPath);
        fwrite(STDERR, "Não foi possível publicar catalogo.js.\n");
        exit(1);
    }

    fwrite(STDOUT, 'Catálogo atualizado: ' . $catalog['total'] . " imagens.\n");
    exit(0);
}

if (in_array('--check', $arguments, true)) {
    $currentContents = is_file($fallbackPath) ? file_get_contents($fallbackPath) : false;
    if ($currentContents !== $fallbackContents) {
        fwrite(STDERR, "catalogo.js está desatualizado. Execute com --write.\n");
        exit(1);
    }

    fwrite(STDOUT, 'Catálogo válido: ' . $catalog['total'] . " imagens.\n");
    exit(0);
}

if (PHP_SAPI !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
}

echo $json . "\n";
