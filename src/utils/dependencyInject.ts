import 'reflect-metadata';

const metadataKey = Symbol('method');

const metadataValue = 'deorator';
class C {
  @Reflect.metadata(metadataKey, metadataValue)
  logger: any;
}

Reflect.defineMetadata(metadataKey, metadataValue, C.prototype, 'logger');

let obj = new C();
let value = Reflect.getMetadata(metadataKey, obj, 'logger');
console.log('🚀 ~ value:', value);
