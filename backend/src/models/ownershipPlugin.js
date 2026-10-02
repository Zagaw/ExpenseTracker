function stripOwner(update) {
  if (!update || typeof update !== 'object') {
    return;
  }

  delete update.userId;
  delete update.user_id;

  if (update.$set) {
    delete update.$set.userId;
    delete update.$set.user_id;
  }
}

const WRITE_HOOKS = ['findOneAndUpdate', 'updateOne', 'updateMany'];

export function protectOwnership(schema) {
  for (const hook of WRITE_HOOKS) {
    schema.pre(hook, function stripOwnerFromUpdate() {
      const update = this.getUpdate() ?? {};
      stripOwner(update);
      this.setUpdate(update);
    });
  }
}
