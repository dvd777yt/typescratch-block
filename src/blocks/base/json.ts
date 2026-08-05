import { BlockID } from "../../utils/generateRandomBlockId";
import { BlockFields } from "./field";
import { BlockInputs } from "./input";

export interface BlockJSON {
   opcode: string;
   next: BlockID | null;
   parent: BlockID | null;
   inputs: BlockInputs;
   fields: BlockFields;
   shadow: boolean;
   topLevel: boolean;
   x: number;
   y: number;
}
