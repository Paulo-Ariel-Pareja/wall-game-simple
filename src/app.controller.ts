import { Controller } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Ruta raíz comentada para permitir que ServeStaticModule sirva index.html
  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }
}
