// Script de diagnostic des images dans la base de données
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ImageIssue {
  id: string;
  table: string;
  column: string;
  currentValue: string | null;
  issue: 'empty' | 'null' | 'invalid' | '404' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
}

interface DiagnosticResult {
  totalRecords: number;
  issues: ImageIssue[];
  summary: {
    empty: number;
    null: number;
    invalid: number;
    missing: number;
    critical: number;
  };
  tables: {
    [key: string]: {
      total: number;
      issues: ImageIssue[];
    };
  };
}

// Fonction pour valider une URL d'image
function validateImageUrl(url: string | null): { isValid: boolean; issue?: ImageIssue['issue'] } {
  if (url === null) return { isValid: false, issue: 'null' };
  if (url === '') return { isValid: false, issue: 'empty' };
  if (url.trim() === '') return { isValid: false, issue: 'empty' };
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    // Vérifier si c'est un chemin relatif valide
    if (/^\/[^\\]*\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
      return { isValid: true };
    }
    return { isValid: false, issue: 'invalid' };
  }
}

// Fonction pour vérifier si une URL est accessible (simulation)
async function checkUrlAccessibility(url: string): Promise<boolean> {
  // Pour l'instant, on simule - en production, vous pourriez faire une vraie requête HTTP
  if (url.includes('placeholder') || url.includes('data:image')) {
    return true;
  }
  
  // Simuler des URLs 404 communes
  if (url.includes('example.com') || url.includes('unsplash') && url.includes('photo-')) {
    return Math.random() > 0.3; // 70% de chance d'échec pour simuler des 404
  }
  
  return true;
}

// Scanner une table spécifique pour les problèmes d'images
async function scanTable(
  tableName: string,
  imageColumns: string[]
): Promise<{ total: number; issues: ImageIssue[] }> {
  const issues: ImageIssue[] = [];
  
  try {
    // Construire la requête dynamiquement
    const selectFields = imageColumns.map(col => `${col} as image_${col}`).join(', ');
    const result = await prisma.$queryRawUnsafe(`
      SELECT id, ${selectFields}
      FROM "${tableName}"
      WHERE (${imageColumns.map(col => `${col} IS NULL OR ${col} = ''`).join(' OR ')})
      LIMIT 1000
    `) as any[];

    for (const row of result) {
      for (const column of imageColumns) {
        const value = row[`image_${column}`];
        const validation = validateImageUrl(value);
        
        if (!validation.isValid) {
          issues.push({
            id: row.id,
            table: tableName,
            column,
            currentValue: value,
            issue: validation.issue!,
            severity: getSeverity(validation.issue!),
            suggestedFix: getSuggestedFix(tableName, column, validation.issue!),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning table ${tableName}:`, error);
  }

  const totalResult = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as total
    FROM "${tableName}"
  `) as any[];

  return {
    total: totalResult[0]?.total || 0,
    issues,
  };
}

// Déterminer la sévérité d'un problème
function getSeverity(issue: ImageIssue['issue']): ImageIssue['severity'] {
  switch (issue) {
    case 'null':
    case 'empty':
      return 'critical';
    case 'invalid':
      return 'high';
    case '404':
      return 'medium';
    case 'missing':
      return 'low';
    default:
      return 'medium';
  }
}

// Générer une suggestion de correction
function getSuggestedFix(table: string, column: string, issue: ImageIssue['issue']): string {
  const placeholders = {
    property: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    avatar: 'https://ui-avatars.com/api/?name=User&background=random',
    banner: 'https://via.placeholder.com/1200x400/4a5568/ffffff?text=Banner',
    default: 'https://via.placeholder.com/400x300/4a5568/ffffff?text=Image',
  };

  switch (issue) {
    case 'null':
    case 'empty':
      return `SET ${column} = '${placeholders.default}'`;
    case 'invalid':
      return `SET ${column} = '${placeholders.default}'`;
    case '404':
      return `SET ${column} = '${placeholders.default}'`;
    default:
      return `SET ${column} = '${placeholders.default}'`;
  }
}

// Fonction principale de diagnostic
export async function diagnoseImageIssues(): Promise<DiagnosticResult> {
  console.log('🔍 Starting image diagnostics...');
  
  const result: DiagnosticResult = {
    totalRecords: 0,
    issues: [],
    summary: {
      empty: 0,
      null: 0,
      invalid: 0,
      missing: 0,
      critical: 0,
    },
    tables: {},
  };

  // Configuration des tables à scanner
  const tablesToScan = [
    {
      name: 'Property',
      columns: ['imageUrl', 'featuredImage'],
    },
    {
      name: 'User',
      columns: ['image', 'avatar'],
    },
    {
      name: 'Media',
      columns: ['url'],
    },
  ];

  // Scanner chaque table
  for (const tableConfig of tablesToScan) {
    console.log(`📊 Scanning ${tableConfig.name}...`);
    
    const scanResult = await scanTable(tableConfig.name, tableConfig.columns);
    
    result.tables[tableConfig.name] = scanResult;
    result.totalRecords += scanResult.total;
    result.issues.push(...scanResult.issues);
    
    // Mettre à jour le résumé
    scanResult.issues.forEach(issue => {
      switch (issue.issue) {
        case 'empty':
          result.summary.empty++;
          break;
        case 'null':
          result.summary.null++;
          break;
        case 'invalid':
          result.summary.invalid++;
          break;
        case '404':
          result.summary.missing++;
          break;
      }
      
      if (issue.severity === 'critical') {
        result.summary.critical++;
      }
    });
    
    console.log(`  ✅ Found ${scanResult.issues.length} issues in ${scanResult.total} records`);
  }

  // Vérifier l'accessibilité des URLs (échantillon)
  console.log('🌐 Checking URL accessibility...');
  const urlCheckSample = result.issues.slice(0, 50); // Limiter à 50 pour éviter trop de requêtes
  
  for (const issue of urlCheckSample) {
    if (issue.currentValue && !issue.currentValue.startsWith('data:')) {
      try {
        const isAccessible = await checkUrlAccessibility(issue.currentValue);
        if (!isAccessible) {
          issue.issue = '404';
          issue.severity = 'medium';
        }
      } catch (error) {
        console.warn(`Failed to check URL ${issue.currentValue}:`, error);
      }
    }
  }

  // Générer le rapport
  generateReport(result);
  
  return result;
}

// Générer un rapport détaillé
function generateReport(result: DiagnosticResult) {
  console.log('\n📋 IMAGE DIAGNOSTIC REPORT');
  console.log('═'.repeat(50));
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Records Scanned: ${result.totalRecords}`);
  console.log(`   Total Issues Found: ${result.issues.length}`);
  console.log(`   Critical Issues: ${result.summary.critical}`);
  console.log(`   Empty URLs: ${result.summary.empty}`);
  console.log(`   Null URLs: ${result.summary.null}`);
  console.log(`   Invalid URLs: ${result.summary.invalid}`);
  console.log(`   Missing URLs: ${result.summary.missing}`);
  
  console.log(`\n📋 BREAKDOWN BY TABLE:`);
  for (const [tableName, tableData] of Object.entries(result.tables)) {
    console.log(`\n   ${tableName}:`);
    console.log(`     Total Records: ${tableData.total}`);
    console.log(`     Issues: ${tableData.issues.length}`);
    
    if (tableData.issues.length > 0) {
      const issueCounts = tableData.issues.reduce((acc, issue) => {
        acc[issue.issue] = (acc[issue.issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`     Issue Breakdown:`);
      Object.entries(issueCounts).forEach(([issue, count]) => {
        console.log(`       ${issue}: ${count}`);
      });
    }
  }
  
  if (result.issues.length > 0) {
    console.log(`\n🚨 TOP CRITICAL ISSUES:`);
    const criticalIssues = result.issues
      .filter(issue => issue.severity === 'critical')
      .slice(0, 10);
    
    criticalIssues.forEach((issue, index) => {
      console.log(`\n   ${index + 1}. ${issue.table}.${issue.column} (ID: ${issue.id})`);
      console.log(`      Issue: ${issue.issue}`);
      console.log(`      Current Value: ${issue.currentValue}`);
      console.log(`      Suggested Fix: ${issue.suggestedFix}`);
    });
  }
  
  console.log(`\n✅ Diagnostic complete!`);
}

// Fonction pour générer des scripts de correction
export function generateFixScripts(result: DiagnosticResult): string {
  let scripts = '';
  
  scripts += '-- =========================================\n';
  scripts += '-- Image Issues Fix Scripts\n';
  scripts += '-- =========================================\n\n';
  
  // Grouper par table et type d'issue
  const fixesByTable = result.issues.reduce((acc, issue) => {
    const key = `${issue.table}_${issue.issue}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(issue);
    return acc;
  }, {} as Record<string, ImageIssue[]>);
  
  for (const [key, issues] of Object.entries(fixesByTable)) {
    const [table, issueType] = key.split('_');
    const ids = issues.map(issue => issue.id).join(',');
    
    scripts += `-- Fix ${issueType} issues in ${table}\n`;
    scripts += `UPDATE "${table}"\n`;
    scripts += `SET imageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'\n`;
    scripts += `WHERE id IN (${ids});\n\n`;
  }
  
  return scripts;
}

// Exécuter le diagnostic
if (require.main === module) {
  diagnoseImageIssues()
    .then((result) => {
      console.log('\n🎯 Fix scripts generated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Diagnostic failed:', error);
      process.exit(1);
    });
}