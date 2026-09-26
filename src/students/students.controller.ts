import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage, SelfServiceRoute } from 'src/auth/requires-page.decorator';
import { STUDENT_DIRECTORY_PAGES } from 'src/auth/page-groups';
import { StudentsService } from './students.service';
import { StudentSelfService } from './student-self.service';
import { StudentAccountsService } from './student-accounts.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BulkCreateStudentDto } from './dto/bulk-create-student.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
// The roster is staff data. STUDENT_DIRECTORY_PAGES deliberately excludes the
// pages a pupil holds, so a signed-in student cannot read other pupils' records
// — they get their own through the /students/me routes below, which opt out.
@RequiresPage(...STUDENT_DIRECTORY_PAGES)
@Controller('students')
export class StudentsController {
    constructor(
        private readonly studentsService: StudentsService,
        private readonly selfService: StudentSelfService,
        private readonly accounts: StudentAccountsService,
    ) { }

    // ---------------------------------------------------------------- self
    // Declared before @Get(':id') so "me" is never matched as an id.

    /** The signed-in pupil's own record. */
    @SelfServiceRoute()
    @Get('me')
    me(@Req() req: any) {
        return this.selfService.resolveStudent(req.user.id);
    }

    /** The signed-in pupil's fee statement. Read-only by design — there is no
     *  corresponding write route, so a pupil can see a balance but never edit one. */
    @SelfServiceRoute()
    @Get('me/fees')
    myFees(@Req() req: any) {
        return this.selfService.fees(req.user.id);
    }

    /** The signed-in pupil's results, withheld while any balance is outstanding. */
    @SelfServiceRoute()
    @Get('me/results')
    myResults(@Req() req: any) {
        return this.selfService.results(req.user.id);
    }

    // -------------------------------------------------------------- staff

    @Post()
    create(@Body() dto: CreateStudentDto) {
        return this.studentsService.create(dto);
    }

    /** Give a login to every pupil who does not have one yet. Idempotent, so it
     *  is the repair button after a bulk import. */
    @RequiresPage('students')
    @Post('accounts/backfill')
    async backfillAccounts() {
        const students = await this.studentsService.findAllIds();
        return this.accounts.provisionMany(students);
    }

    /** Re-issue or repair the login for one pupil. Idempotent. */
    @RequiresPage('students', 'admissions')
    @Post(':id/account')
    @ApiParam({ name: 'id' })
    provisionAccount(@Param('id') id: string) {
        return this.accounts.provision(id);
    }

    @Post('bulk')
    bulkCreate(@Body() dto: BulkCreateStudentDto) {
        return this.studentsService.bulkCreate(dto.students);
    }

    @Get()
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'className', required: false })
    @ApiQuery({ name: 'status', required: false, description: 'active | graduated | transferred' })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('className') className?: string,
        @Query('status') status?: string,
    ) {
        return this.studentsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            search,
            className,
            status,
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id' })
    findOne(@Param('id') id: string) {
        return this.studentsService.findOne(id);
    }

    @Patch(':id')
    @ApiParam({ name: 'id' })
    update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
        return this.studentsService.update(id, dto);
    }

    @Delete(':id')
    @ApiParam({ name: 'id' })
    remove(@Param('id') id: string) {
        return this.studentsService.remove(id);
    }
}
