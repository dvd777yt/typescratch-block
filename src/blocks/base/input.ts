import { BlockID } from "../../utils/generateRandomBlockId";

export type InputType = 1 | 2 | 3 | 4;

export type InputValueLiteral = [1, string | number];
export type InputValueReference = [2, BlockID];
export type InputValueShadow = [3, BlockID];
export type InputValueObscure = [4, BlockID];

export const literal = (v: string | number): InputValueLiteral => [1, v];
export const ref = (v: BlockID): InputValueReference => [2, v];
export const shadow = (v: BlockID): InputValueShadow => [3, v];
export const obscure = (v: BlockID): InputValueObscure => [4, v];

export type InputValue =
   | InputValueLiteral
   | InputValueReference
   | InputValueShadow
   | InputValueObscure;

export type BlockInputs = Record<string, InputValue>;
