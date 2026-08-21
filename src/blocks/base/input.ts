import { BlockID } from "../../utils/generateRandomBlockId";
import { Block } from "./block";

export type InputType = 1 | 2 | 3 | 4;

export type InputValueLiteral = [1, string | number];
export type InputValueReference = [2, BlockID];
export type InputValueShadow = [3, BlockID];
export type InputValueObscure = [4, BlockID];

export const literal = (v: string | number): InputValueLiteral => [1, v];
export const ref = (v: BlockID): InputValueReference => [2, v];
export const shadow = (v: BlockID): InputValueShadow => [3, v];
export const obscure = (v: BlockID): InputValueObscure => [4, v];

export type InputValueJSON =
   | InputValueLiteral
   | InputValueReference
   | InputValueShadow
   | InputValueObscure;

export type BlockInputsJSON = Record<string, InputValueJSON>;
export type BlockInputs = Record<string, Block|null>;

export function serializeInput(input: Block|null): InputValueJSON | undefined {
   if (input === null) return undefined;

   if (input instanceof LiteralBlock) return literal(input.value);
   if (input instanceof ShadowBlock) return shadow(input.id);
   if (input instanceof ReporterBlock) return ref(input.id);

   throw new Error("Unknown input block type");
}