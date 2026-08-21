export class TypeScratchBlocks {
   static unsafeWarningsEnabled = true;
   static warnUnsafe(msg: string) {
      if (this.unsafeWarningsEnabled) {
         console.warn(`⚠️ Unsafe: ${msg}`);
      }
   }
}
