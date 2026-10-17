import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPrepaidShippingField1788164668266 implements MigrationInterface {

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order" ADD "customFieldsPrepaidshipping" boolean DEFAULT false`, undefined);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customFieldsPrepaidshipping"`, undefined);
   }

}
