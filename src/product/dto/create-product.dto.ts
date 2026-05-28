import { ApiProperty, PartialType } from "@nestjs/swagger"
import { ExamType, HolidayType, ProductCategory } from "@prisma/client"
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from 'class-transformer';

export class CreateProductDto {
    @ApiProperty()
    @IsEnum(ProductCategory, { message: "Please select the correct category" })
    @IsNotEmpty()
    category!: ProductCategory;

    @ApiProperty({ required: false, enum: HolidayType, description: "Only meaningful when category=holiday_packages" })
    @IsEnum(HolidayType, { message: "holidayType must be NEWS or BOND" })
    @IsOptional()
    holidayType?: HolidayType;

    @ApiProperty({ required: false, enum: ExamType, description: "Only meaningful when category=exams" })
    @IsEnum(ExamType, { message: "examType must be JUBRA or AMAZON" })
    @IsOptional()
    examType?: ExamType;

    @ApiProperty({ required: false, description: "Free-text set label, only meaningful for Primary 7 exams (e.g. 'Set I', 'Set II')" })
    @IsString()
    @IsOptional()
    examSet?: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    price!: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    costPrice?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    reorderLevel?: number;

    @ApiProperty({ required: false, description: "Ignored — always created with 0 stock. Stock is added via production." })
    @IsNumber()
    @IsOptional()
    totalStock?: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    classLevel?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    subject?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    featured?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
}

export class StockTakeItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    quantityTaken!: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    quantitySold!: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    quantityReturned!: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    revenue!: number;
}

export class CreateStockTakeDto {
    @ApiProperty({ type: [StockTakeItemDto] }) // Tells Swagger it's an array
    @IsArray()
    @ValidateNested({ each: true }) // Validates every object inside the array
    @Type(() => StockTakeItemDto)   // Necessary for class-transformer to "see" the child DTO
    items!: StockTakeItemDto[];
}

export class UpdateStockTakeItemDto extends PartialType(StockTakeItemDto) { }