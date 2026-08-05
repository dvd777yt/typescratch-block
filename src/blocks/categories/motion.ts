import { Block } from "../base/block";
import { InputValueLiteral, literal } from "../base/input";
import { BlockJSON } from "../base/json";

export interface MoveStepsBlockJSON extends BlockJSON {
   opcode: "motion_movesteps";
   inputs: { steps: InputValueLiteral };
}

export class MoveStepsBlock extends Block {
   readonly opcode = "motion_movesteps" as const;
   inputs = { STEPS: literal(10) };

   constructor(steps: number) {
      super();
      this.inputs.STEPS = literal(steps);
   }
}

export function MoveSteps(steps: number): MoveStepsBlock;
export function MoveSteps(opts: { steps: number }): MoveStepsBlock;

export function MoveSteps(arg: number | { steps: number }): MoveStepsBlock {
   return new MoveStepsBlock(typeof arg !== "object" ? arg : arg.steps);
}
