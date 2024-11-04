import Generator from 'yeoman-generator';
import path from 'path';
import fs from 'fs';
import { ExcelCommand } from './utils/excel-to-prisma.js';
import { toSnake, toKebab, toPascal, toCamel } from './utils/utils.js';

export default class extends Generator {
  answers: any;

  async prompting() {
    this.answers = await this.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        default: this.appname,
      },
      {
        type: 'input',
        name: 'destinationPath',
        message: 'Where would you like to place the project?',
        default: this.destinationRoot(),
      },
      {
        type: 'input',
        name: 'generatorFilePath',
        message: 'Provide the full path to the generator.xlsx file:',
        validate: function (input) {
          if (fs.existsSync(input)) {
            return true;
          }
          return 'File does not exist, please provide a valid path.';
        },
      },
    ]);
  }

  writing() {
    const { projectName, destinationPath } = this.answers;
    this.log(`Creating project: ${projectName} in ${destinationPath}`);

    // Copy the template to the destination path
    this.fs.copyTpl(
      this.templatePath('initial/**/{*,.*,.*/**}'), // Include hidden files and folders
      this.destinationPath(path.join(destinationPath, projectName)),
      { name: projectName }
    );

    // save projectFullPath
    this.answers.projectFullPath = path.join(destinationPath, projectName);
  }

  async install() {
    const { projectFullPath, generatorFilePath } = this.answers;
    this.log(`Changing directory to: ${projectFullPath}`);

    this.log('Installing dependencies...');
    this.spawnSync('npm', ['install'], { cwd: projectFullPath });

    this.log('Generating Prisma schema from Excel...');
    const excelToPrisma = new ExcelCommand();
    await excelToPrisma.generatePrismaSchema(
      generatorFilePath,
      projectFullPath
    );

    const { generateMigrations } = await this.prompt([
      {
        type: 'confirm',
        name: 'generateMigrations',
        message: 'Generate Prisma migrations?',
        default: true,
      },
    ]);

    if (generateMigrations) {
      const { databaseUrl } = await this.prompt([
        {
          type: 'input',
          name: 'databaseUrl',
          message: 'Provide the database URL:',
          default: 'mysql://root:my-secret-pw@localhost:3306/ssg-test',
        },
      ]);

      // Generate the initial Prisma migration
      this._generateMigrations(databaseUrl);

      // Generate the Prisma client
      this._generatePrismaClient();

      // Generate modules
      this._generateModules();
    }
  }

  _generateMigrations(databaseUrl: string) {
    this.log('Creating .env file...');
    fs.writeFileSync(
      path.join(this.answers.projectFullPath, '.env'),
      `DATABASE_URL=${databaseUrl}`
    );

    this.log('Generate initial Prisma migration');
    this.spawnSync('npx', ['prisma', 'migrate', 'dev', '--name', 'init'], {
      cwd: this.answers.projectFullPath,
    });
  }

  _generatePrismaClient() {
    this.log('Generate Prisma client');
    this.spawnSync('npx', ['prisma', 'generate'], {
      cwd: this.answers.projectFullPath,
    });
  }

  _generateModules() {
    this.log('Generate modules');
    const domains = ['user', 'friend'];
    fs.mkdirSync(path.join(this.answers.projectFullPath, 'src', 'domain'));

    domains.forEach((domain) => {
      this.log(`Generate module: ${domain}`);

      const domainPath = path.join(
        this.answers.projectFullPath,
        'src',
        'domain',
        domain
      );

      fs.mkdirSync(domainPath);

      const domainCases = {
        domainCamelCase: toCamel(domain),
        domainPascalCase: toPascal(domain),
        domainKebabCase: toKebab(domain),
        domainSnakeCase: toSnake(domain),
      };

      // Copy base controller
      this.fs.copyTpl(
        this.templatePath(`domain/base.controller.ejs`),
        this.destinationPath(path.join(domainPath, `${domain}.controller.ts`)),
        domainCases
      );

      // Copy base service
      this.fs.copyTpl(
        this.templatePath(`domain/base.service.ejs`),
        this.destinationPath(path.join(domainPath, `${domain}.service.ts`)),
        domainCases
      );

      // Copy base module
      this.fs.copyTpl(
        this.templatePath(`domain/base.module.ejs`),
        this.destinationPath(path.join(domainPath, `${domain}.module.ts`)),
        domainCases
      );

      fs.mkdirSync(path.join(domainPath, 'dto'));

      // Copy create-base.dto.ejs
      this.fs.copyTpl(
        this.templatePath(`domain/create-base.dto.ejs`),
        this.destinationPath(
          path.join(
            domainPath,
            `dto/create-${domainCases.domainSnakeCase}.dto.ts`
          )
        ),
        domainCases
      );

      // Copy update-base.dto.ejs
      this.fs.copyTpl(
        this.templatePath(`domain/update-base.dto.ejs`),
        this.destinationPath(
          path.join(
            domainPath,
            `dto/update-${domainCases.domainSnakeCase}.dto.ts`
          )
        ),
        domainCases
      );
    });
  }
}
