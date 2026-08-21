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
   _substacks: Record<number, Block[]> = Object.create(null);
   get substacks(): Record<number, Block[]> {
      return this._substacks;
   }
   get children(): Block[] {
      return Object.values(this._substacks).flat();
   }
   addChild(slot: number, after: Block|null, block: Block): Block {
      return this.attatchChild(slot, after, block);
   }
   attatchChild(slot: number, after: Block|null, block: Block): Block {
      this.declareUndead();
   
      if (!(slot in this._substacks && typeof slot === "number")) {
         throw new Error("'slot' is not in substacks or is not a number");
      }
      if (!(after instanceof Block) && after !== null) {
         throw new Error("after is not a Block or null");
      }
      if (!(block instanceof Block)) {
         throw new Error("block is not an instance of Block");
      }

      const substack = this._substacks[slot];
      if (after === null) {
         substack.splice(0, 0, block);
      } else {
         const idx = substack.indexOf(after);
         if (idx == -1) {
            throw new Error("'after' is not a child of this.substacks[slot]");
         }
         substack.splice(idx + 1, 0, block);
      }
      block.parent = [this, slot];
      return block;
   }
   addChildUnsafe(slot: number, after: Block|null, block: Block): Block {
      return this.attatchChildUnsafe(slot, after, block);
   }
   attatchChildUnsafe(slot: number, after: Block|null, block: Block): Block {
      TypeScratchBlocks.warnUnsafe("attatching child block without invariant checks");

      const substack = this._substacks[slot];
      if (after === null) {
         substack.splice(0, 0, block);
      } else {
         const idx = substack.indexOf(after);
         if (idx == -1) {
            // NEVER throw in unsafe mode - insert at start as fallback
            substack.splice(0, 0, block);
         }
         else {
            substack.splice(idx + 1, 0, block);
         }
      }

      block._parent = [this, slot];

      return block;
   }
   detatchChild(child: Block): Block {
      this.declareUndead();
      if (child.parentBlock !== this) {
         throw new Error("'child' is not a child of 'this'");
      }
      if (!(child instanceof Block)) {
         throw new Error("'child' is not a Block");
      }

      const slot = child.parentSlot!;
      const arr = this.substacks[slot];

      const idx = arr.indexOf(child);
      if (idx > -1) arr.splice(idx, 1);

      if (child._prevBlock) {
         child._prevBlock._nextBlock = child._nextBlock;
      }
      if (child._nextBlock) {
         child._nextBlock._prevBlock = child._prevBlock;
      }

      child.parent = null;
      child._prevBlock = null;
      child._nextBlock = null;

      return child;
   }
   detatchChildUnsafe(child: Block): Block {
      TypeScratchBlocks.warnUnsafe("detatching child without invariant checks")

      const slot = child.parentSlot;
      if (slot) {
         const arr = this.substacks[slot];
         
         const idx = arr.indexOf(child);
         if (idx > -1) arr.splice(idx, 1);
      }

      if (child._prevBlock) {
         child._prevBlock._nextBlock = child._nextBlock;
      }
      if (child._nextBlock) {
         child._nextBlock._prevBlock = child._prevBlock;
      }

      child.parent = null;
      child._prevBlock = null;
      child._nextBlock = null;

      return child;
   }

   isAncestorOf(block: Block): boolean {
      return block.isDescendantOf(this);
   }
   isDescendantOf(block: Block): boolean {
      let parenthood : Block | null = this.parentBlock;
      while (parenthood !== null) {
         if (parenthood == block) return true;
         parenthood = parenthood.parentBlock;
      }
      return false;
   }

   detectCycle(block: Block): boolean {
      return (
         this == block ||
         this.isAncestorOf(block) ||
         this.isDescendantOf(block)
      );
   }

   get rootBlock(): Block {
      let parenthood : Block = this;
      while (parenthood.parentBlock) {
         parenthood = parenthood.parentBlock;
      }
      return parenthood;
   }

   declareUndead() {
      if (this._destroyed) {
         throw new Error("Cannot mutate a destroyed block.");
      }
   }

   /** @internal */
   _destroyed = false;
   get destroyed(): boolean {
      return this._destroyed;
   }
   destroy() {
      this.declareUndead();
      if (this.parentBlock) {
         this.parentBlock.detatchChild(this);
      }

      for (const child of this.children) {
         child.destroy();
      }

      this._parent = null;
      this._nextBlock = null;
      this._prevBlock = null;
      this._substacks = Object.create(null);

      this._destroyed = true;
   }
   destroyUnsafe() {
      TypeScratchBlocks.warnUnsafe("unsafely destroying block without invariant checks");

      if (this.parentBlock) {
         this.parentBlock.detatchChildUnsafe(this);
      }

      for (const child of this.children) {
         child.destroyUnsafe();
      }

      this._parent = null;
      this._nextBlock = null;
      this._prevBlock = null;
      this._substacks = Object.create(null);

      this._destroyed = true;
   }

   /** @internal */
   _parent: [Block, number] | null = null;
   get parent() : [Block, number] | null {
      return this._parent;
   }
   get parentBlock(): Block | null {
      return this._parent ? this._parent[0] : null;
   }
   get parentSlot(): number | null {
      return this._parent ? this._parent[1] : null;
   }

   private set parent(v: [Block, number] | null) {
      if (v === null) {
         this._parent = null;
         return;
      }

      if (this.detectCycle(v[0])) {
         throw new Error("Cyclic structure detected in private parent setter");
      }

      this._parent = v;
   }
   private set parentUnsafe(v: [Block, number] | null) {
      TypeScratchBlocks.warnUnsafe("Setting parent manually may corrupt graph");
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
      if (!(v instanceof Block) && v !== null) {
         throw new Error("v is not a Block or null");
      }
      this.declareUndead();
      this.prevBlock = v;
   }
   setPrevUnsafe(v: Block|null) {
      TypeScratchBlocks.warnUnsafe("Manually setting prevBlock may corrupt graph.");
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
      if (!(v instanceof Block) && v !== null) {
         throw new Error("v is not a Block or null");
      }
      this.declareUndead();
      this.nextBlock = v;
   }
   setNextUnsafe(v: Block|null) {
      TypeScratchBlocks.warnUnsafe("Manually setting nextBlock may corrupt graph.");
      this._nextBlock = v;
   }

   inputs: BlockInputs = Object.create(null);

   fields: BlockFields = Object.create(null);
   shadow: boolean = false;
   topLevel: boolean = false;
   x: number = 0;
   y: number = 0;

   chain(block: Block): Block {
      if (!(block instanceof Block)) {
         throw new Error("Cannot chain a non-block");
      }
      this.declareUndead();
      this.nextBlock = block;
      return block;
   }

   toString() {
      const parentStr = this._parent
         ? `${this._parent[0].opcode}(${this._parent[0].id}) @ slot ${this._parent[1]}`
         : "null";
      const prevStr = this._prevBlock
         ? `${this._prevBlock.opcode}(${this._prevBlock.id})`
         : "null";
      const nextStr = this._nextBlock
         ? `${this._nextBlock.opcode}(${this._nextBlock.id})`
         : "null";
      const substackSummary = Object
         .values(this._substacks)
         .map(s => s.length)
         .join(", ");
      return `Block(opcode="${this.opcode}", id="${this.id}", destroyed="${this._destroyed}")
- parent:${parentStr}
- prev:${prevStr}
- next:${nextStr}
- substacks:${substackSummary}`;
   }

   inspectGraph(): void {
      const seen = new Set<string>();

      const helper = (block: Block, indent: number) => {
         const pad = " ".repeat(indent);

         if (seen.has(block.id)) {
            console.log(pad + block.toString() + "  [cyclic structure]");
            return;
         }

         seen.add(block.id);
         console.log(block.toString().split("\n").map(s => pad + s).join("\n"));

         for (const [slot, substack] of Object.entries(this._substacks)) {
            console.log(pad + `SUBSTACKS[${slot}]`);
            for (const block of substack) {
               helper(block, indent + 4);
            }
         }
      }

      helper(this, 0);
   }

   validateSelf(): true | never {
      return true;
   }

   validateGraph(): true | never {
      const seen = new Set<Block>();

      // extract every block in the graph
      const helper = (block: Block) => {
         // detect child-parent cyclic structures
         if (seen.has(block))
            throw new Error("validateGraph - cyclic structure detected");

         seen.add(block);
         for (const child of block.children) {
            helper(child);
         }
      }

      // verify block integrity
      for (const block of seen) {
         if (block._prevBlock && block._prevBlock._nextBlock !== block) {
            throw new Error("validateGraph - block.prevBlock.nextBlock isn't block");
         }
         if (block._nextBlock && block._nextBlock._prevBlock !== block) {
            throw new Error("validateGraph - block.nextBlock.prevBlock isn't block");
         }
         if (block._nextBlock == block || block._prevBlock == block) {
            throw new Error("validateGraph - block.nextBlock and/or block.prevBlock are equal to block");
         }
         if (block._destroyed) {
            throw new Error("validateGraph - destroyed block is a part of the graph");
         }
         if (block.parent && !(block.parent[0].substacks[block.parent[1]] ?? []).includes(block)) {
            throw new Error("validateGraph - block is not a child of its parent");
         }
         if (!(block instanceof Block)) {
            throw new Error("validateGraph - block is not Block");
         }
         block.validateSelf();
         
         for (const [key, substack] of Object.entries(block.substacks)) {
            if (isNaN(parseInt(key, 10))) throw new Error("validateGraph - substack key is not a number");
            const slot = parseInt(key, 10);
            if (slot < 0) throw new Error("validateGraph - substack key must be at least zero");
            if (slot > Object.keys(block.substacks).length) {
               throw new Error(
                  "validateGraph - substack keys must be in incrementing order\n" +
                  "(a substack key was found that has a higher value then the total amount of substacks)"
               );
            }

            for (const child of substack) {
               if (child.parentBlock !== block || child.parentSlot !== slot) {
                  throw new Error("validateGraph - parentSlot/parentBlock do not match true parent");
               }
            }            
         }

         // verify children integrity
         for (let i = 0; i < block.children.length; i++) {
            if (block.children[i]._prevBlock !== (block.children[i - 1] ?? null)) {
               throw new Error("validateGraph - block.prevBlock is not the block's previous block");
            }
            if (block.children[i]._nextBlock !== (block.children[i + 1] ?? null)) {
               throw new Error("validateGraph - block.nextBlock is not the block's next block");
            }
            if (block.children[i].parentBlock !== block) {
               throw new Error("validateGraph - block.children[i].parentBlock isn't block");
            }
         }
      }

      return true;
   }

   toScratchBlockJSON(): [BlockID, BlockJSON] {
      this.declareUndead();
      const json: BlockJSON = {
         opcode: this.opcode,
         next: this.nextBlock?.id ?? null,
         parent: this.parentBlock?.id ?? null,
         inputs: this.inputs,
         fields: this.fields,
         shadow: this.shadow,
         topLevel: this.topLevel,
         x: this.x,
         y: this.y,
      };
      for (const [key, substack] of Object.entries(this.substacks)) {
         const no = Number(key);
         json.inputs[no == 0 ? "SUBSTACK" : `SUBSTACK${no + 1}`] = ref(substack[0].id);
      }
      return [this.id, json];
   }

   toScratchBlockJSONUnsafe(): [BlockID, BlockJSON] {
      TypeScratchBlocks.warnUnsafe("converting to scratch block JSON without undead checks");
      const json: BlockJSON = {
         opcode: this.opcode,
         next: this.nextBlock?.id ?? null,
         parent: this.parentBlock?.id ?? null,
         inputs: this.inputs,
         fields: this.fields,
         shadow: this.shadow,
         topLevel: this.topLevel,
         x: this.x,
         y: this.y,
      };
      for (const [key, substack] of Object.entries(this.substacks)) {
         const no = Number(key);
         json.inputs[no == 0 ? "SUBSTACK" : `SUBSTACK${no + 1}`] = ref(substack[0].id);
      }
      return [this.id, json];
   }
}
