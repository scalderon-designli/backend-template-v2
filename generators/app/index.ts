import Generator from 'yeoman-generator';
import path from 'path';
import fs from 'fs';
import { ExcelCommand } from './utils/excel-to-prisma.js';

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

  async writing() {
    const { projectName, destinationPath, generatorFilePath } = this.answers;
    this.log(`Creating project: ${projectName} in ${destinationPath}`);

    // Copy the template to the destination path
    this.fs.copyTpl(
      this.templatePath('**/{*,.*,.*/**}'), // Include hidden files and folders
      this.destinationPath(path.join(destinationPath, projectName)),
      { name: projectName }
    );
  }
}
