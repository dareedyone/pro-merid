import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
// import { doubleCsrf } from 'csrf-csrf';
import { AppModule } from './app.module';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { GlobalHttpExceptionFilter } from './filter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const {
  //   invalidCsrfTokenError,
  //   generateToken, // Use this in your routes to generate and provide a CSRF hash, along with a token cookie and token.
  //   validateRequest, // Also a convenience if you plan on making your own middleware.
  //   doubleCsrfProtection, // This is the default CSRF protection middleware.
  // } = doubleCsrf(doubleCsrfOptions);

  const config = new DocumentBuilder()
    .setTitle('Specfynd API')
    .setDescription('The specfind api')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors();
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      // disableErrorMessages: true,
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(
    // new LoggingInterceptor(),
    // new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
