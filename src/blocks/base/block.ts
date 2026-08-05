import { TypeScratchBlocks } from "../../typescratchBlocks";
import {
   BlockID,
   generateRandomBlockId,
} from "../../utils/generateRandomBlockId";
import { BlockFields } from "./field";
import { BlockInputs, ref } from "./input";
import { BlockJSON } from "./json";

export class Block {
   id: BlockID = generateRandomBlockId();
   opcode: string = "Block";
   
   /** @internal */
   _substacks: Record<number, Block[]> = [];
   get substacks(): Record<number, Block[]> {
      return this._substacks;
   }
   get children(): Block[] {
      return Object.values(this._substacks).flat();
   }
   addChild(slot: number, after: Block|null, block: Block): Block {
      const substack = this._substacks[slot];
      if (!substack) {
         throw new Error("'slot' is not a valid key in this.substacks");
      }
      if (after === null) {
         substack.splice(0, 0, block);
      } else {
         const idx = substack.indexOf(after);
         if (idx == -1) {
            throw new Error("'after' is not a child of this.substacks[slot]");
         }
         substack.splice(idx + 1, 0, block);
      }
      return block;
   }
   detatchChild() {

   }

   /** @internal */
   _parent: Block | null = null;
   get parent() : Block | null {
      return this._parent;
   }
   private set parent(v: Block|null) {
      // invariant: update the new parent's children
      if (v && !v._children.includes(this)) {
         v._children.push(this);
      }
      // invariant: reset the old parent's children
      if (this._parent && this._parent._children.includes(this)) {
         this._parent._children.filter(b => b !== this);
      }
      this._parent = v;
   }
   setParent(v: Block|null) {
      this.parent = v;
   }
   setParentUnsafe(v: Block|null) {
      if (TypeScratchBlocks.unsafeWarningsEnabled) {
         console.warn("⚠️ Unsafe: Manually setting parent may corrupt graph.");
      }
      this._parent = v;
   }


   /** @internal */
   _prevBlock: Block | null = null;
   get prevBlock(): Block|null {
      return this._prevBlock;
   }
   private set prevBlock(v: Block|null) {
      // invariant: update the new block's nextBlock (if not null)
      if (v && v.nextBlock !== this) {
         v._nextBlock = this;
      }
      // invariant: reset the old block's nextBlock (if not being set)
      if (this._prevBlock && this._prevBlock !== v) {
         this._prevBlock._nextBlock = null;
      }
      this._prevBlock = v;
   }
   setPrev(v: Block|null) {
      this.prevBlock = v;
   }
   setPrevUnsafe(v: Block|null) {
      if (TypeScratchBlocks.unsafeWarningsEnabled) {
         console.warn("⚠️ Unsafe: Manually setting prevBlock may corrupt graph.");
      }
      this._prevBlock = v;
   }

   /** @internal */
   _nextBlock: Block | null = null;
   get nextBlock(): Block|null {
      return this._nextBlock;
   }
   private set nextBlock(v: Block|null) {
      // invariant: update the new block's prevBlock (if not null)
      if (v && v.prevBlock !== this) {
         v._prevBlock = this;
      }
      // invariant: reset the old block's prevBlock (if not being set)
      if (this._nextBlock && this._nextBlock !== v) {
         this._nextBlock._prevBlock = null;
      }
      this._nextBlock = v;
   }
   setNext(v: Block|null) {
      this.nextBlock = v;
   }
   setNextUnsafe(v: Block|null) {
      if (TypeScratchBlocks.unsafeWarningsEnabled) {
         console.warn("⚠️ Unsafe: Manually setting nextBlock may corrupt graph.");
      }
      this._nextBlock = v;
   }

   inputs: BlockInputs = {};

   fields: BlockFields = {};
   shadow: boolean = false;
   topLevel: boolean = false;
   x: number = 0;
   y: number = 0;

   chain(block: Block): Block {
      this.nextBlock = block;
      block.prevBlock = this;
      return block;
   }

   toScratchBlockJSON(): [BlockID, BlockJSON] {
      const json: BlockJSON = {
         opcode: this.opcode,
         next: this.nextBlock?.id ?? null,
         parent: this.parent?.id ?? null,
         inputs: this.inputs,
         fields: this.fields,
         shadow: this.shadow,
         topLevel: this.topLevel,
         x: this.x,
         y: this.y,
      };
      if (this.children.length > 0)
         json.inputs["SUBSTACK"] = ref(this.children[0].id);
      return [this.id, json];
   }
}
