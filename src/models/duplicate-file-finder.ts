import { FileReader, IBufferResult, ICrcResult } from './file-reader';
import { Timer } from './timer';

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
  recursive: boolean;
}

export class DuplicateFileFinder {

  private readonly $fileReader: FileReader;

  constructor(params: {
    pathToCheck: string;
    recursive: boolean;
  }) {
    if (params.pathToCheck.length <= 0) {
      throw new Error('"pathToCheck" cannot be empty.');
    }

    this.$fileReader = new FileReader({
      directoyPath: params.pathToCheck,
      recursive: params.recursive,
    });
  }

  public async find(): Promise<string[][]> {
    const { files } = await this.$fileReader.read();
    const sameFilesGroups = await this.findDuplicatedFromReadResult(files);

    // const formatedResults: string[][] = sameFilesGroups.map((group) => group.map((elem) => filePathes[elem]!));

    return sameFilesGroups;
  }

  private async findDuplicatedFromReadResult(list: IBufferResult[] | ICrcResult[]): Promise<string[][]> {
    return new Timer(`Compared ${list.length} files in`).run(() => {
      const sameFiles: string[][] = [];
      const totalFiles = list.length;
      let totalIteration = 0;
      while (list.length > 0) {
        totalIteration++;
        if (totalIteration % 1e3 === 0) {
          console.log('processed', totalIteration, '/', totalFiles, 'files');
        }

        const current = list.pop();
        if (current === undefined) {
          continue;
        }

        const innerSameFiles: string[] = [];
        for (let compareIndex = 0; compareIndex <= list.length - 1; compareIndex++) {
          const compare = list[compareIndex];
          if (compare === undefined) {
            continue;
          }

          if (!this.isSame(current.result, compare.result)) {
            continue;
          }

          innerSameFiles.push(compare.path);


          list.splice(compareIndex, 1);
          compareIndex--;
        }

        if(innerSameFiles.length > 0) {
          sameFiles.push([current.path, ...innerSameFiles]);
        }
      }

      console.log('Found', Object.keys(sameFiles).length, 'possible duplications');

      return sameFiles;
    });
  }

  private isSame(value1: number | Buffer, value2: number | Buffer): boolean {
    return (
      (
        value1 instanceof Buffer
        && value2 instanceof Buffer
        && value1.equals(value2)
      )
      || (
        typeof value1 === 'number'
        && typeof value2 === 'number'
        && value1 === value2
      )
    )
  }

}
