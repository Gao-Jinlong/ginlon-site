import 'reflect-metadata';

// TODO 实现依赖注入，参考 nestjs

// 定义一个用于存储依赖关系的容器
class DIContainer {
  private static dependencies = new Map<string, any>();

  // 注册依赖
  static register<T>(key: string, value: T): void {
    DIContainer.dependencies.set(key, value);
  }

  // 获取依赖
  static resolve<T>(key: string): T {
    const dependency = DIContainer.dependencies.get(key);
    if (!dependency) {
      throw new Error(`Dependency ${key} not found.`);
    }
    return dependency;
  }
}

// 定义一个装饰器，用于自动注入依赖到属性
function Inject(key: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    // 使用 Reflect.metadata 来存储元数据
    Reflect.defineMetadata('design:type', key, target, propertyKey);
  };
}

// 定义接口和实现类
interface ILogger {
  log(message: string): void;
}

class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[ConsoleLogger]: ${message}`);
  }
}

class FileLogger implements ILogger {
  log(message: string): void {
    console.log(`[FileLogger]: ${message} (pretend this is written to a file)`);
  }
}

// 使用依赖注入的类
class Application {
  @Inject('Logger')
  private logger!: ILogger;

  run() {
    this.logger.log('Application is running!');
  }
}

// 主程序入口
function main() {
  // 注册依赖
  DIContainer.register<ILogger>('Logger', new ConsoleLogger());
  // DIContainer.register<ILogger>('Logger', new FileLogger()); // 替换依赖实现

  // 创建应用实例并运行
  const app = new Application();

  // 通过反射获取属性元数据并注入依赖
  const loggerKey = Reflect.getMetadata('design:type', app, 'logger');
  if (loggerKey) {
    const logger = DIContainer.resolve<ILogger>(loggerKey);
    app['logger'] = logger; // 手动注入依赖
  }

  app.run();
}

main();
