import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCustomerNotesField1788164668267 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" ADD "customFieldsCustomernotes" text DEFAULT ''`,
      undefined
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN "customFieldsCustomernotes"`,
      undefined
    )
  }
}
