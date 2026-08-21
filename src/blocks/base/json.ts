import { BlockID } from "../../utils/generateRandomBlockId";
import { BlockFields } from "./field";
import { BlockInputsJSON } from "./input";

export interface BlockJSON {
   opcode: string;
   next: BlockID | null;
   parent: BlockID | null;
   inputs: BlockInputsJSON;
   fields: BlockFields;
   shadow: boolean;
   topLevel: boolean;
   x: number;
   y: number;
}
