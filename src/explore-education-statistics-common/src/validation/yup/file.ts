import { Schema, addMethod, mixed } from 'yup';

declare module 'yup' {
  interface MixedSchema {
    required(message?: string): this;
    minSize(minBytes: number, message?: string): this;
  }
}


addMethod<Schema<File>>(mixed, 'required', function fileRequired(
  message = 'Required',
) {
  return this.test('required', message, function required(value) {
    if (!value) {
      return false;
    }
    return true;
  });
});

addMethod<Schema<File>>(mixed, 'minSize', function fileMinSize() {
  return this.test(
    'minSize',
    'File must be larger than 0 bytes',
    function minSize(value) {
      if (!value) {
        return true;
      }

      return value.size > 0;
    },
  );
});
