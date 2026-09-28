// Проверка правила CODE_STYLE.md: имя класса в scss это camelCase.
// vite.config.ts ставит css.modules.localsConvention 'camelCaseOnly', поэтому
// доступ в tsx всегда camelCase, и класс, написанный с дефисом, расходится со
// своим же доступом. Проверка ловит ровно это расхождение.
//
// Ловим: .foo-bar, &.foo-bar, &-bar, .foo-bar:hover, .a .foo-bar
// Не ловим и не должны ловить: --token-name, 0.5rem, .5s, @media, @keyframes,
// @include field-base, комментарии.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = 'src'
const SKIP_DIRS = new Set(['node_modules', 'dist', 'generated', '.git'])

// Класс с дефисом: точка не идёт после цифры (иначе это 0.5rem), имя начинается
// с буквы, внутри есть хотя бы один дефис.
const KEBAB_CLASS = /(?<![A-Za-z0-9_-])\.([a-z][A-Za-z0-9]*-[A-Za-z0-9-]*[A-Za-z0-9])/g
// Sass-хвост: &-fooBar склеивается с родителем в .parent-fooBar, поэтому любой
// такой хвост даёт имя с дефисом, даже когда в суффиксе дефисов нет. Ловим все.
const KEBAB_SUFFIX = /&-[A-Za-z][A-Za-z0-9]*/g

// Якорь $ в /$/ гарантирует единственное совпадение на строке, поэтому
// replaceAll здесь не нужен и без флага g бросил бы TypeError.
const LINE_COMMENT = /\/\/.*$/

const stripComments = (source) =>
  source
    .replaceAll(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(LINE_COMMENT, ''))
    .join('\n')

const scssFiles = (dir) => {
  const found = []
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...scssFiles(full))
    else if (entry.endsWith('.scss')) found.push(full)
  }
  return found
}

const violations = []

for (const file of scssFiles(SRC)) {
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n')
  lines.forEach((line, index) => {
    for (const pattern of [KEBAB_CLASS, KEBAB_SUFFIX]) {
      pattern.lastIndex = 0
      for (const match of line.matchAll(pattern)) {
        violations.push(`${relative('.', file)}:${index + 1}  ${match[0]}`)
      }
    }
  })
}

if (violations.length === 0) {
  console.log('scss: имена классов в camelCase, нарушений нет')
  process.exit(0)
}

console.error('scss: имя класса в scss должно быть camelCase, как и доступ в tsx.')
console.error('Локали конвертируются через localsConvention camelCaseOnly,')
console.error('поэтому .foo-bar и .fooBar это одно и то же имя — но читаются по-разному.\n')
for (const violation of violations) console.error(`  ${violation}`)
console.error(`\n${violations.length} шт. Имена классов менять не нужно, если они не kebab.`)
process.exit(1)
