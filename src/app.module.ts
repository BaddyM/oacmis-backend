import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { UploadModule } from './upload/upload.module';
import { StudentsModule } from './students/students.module';
import { StaffModule } from './staff/staff.module';
import { ClassesModule } from './classes/classes.module';
import { TimetableModule } from './timetable/timetable.module';
import { SubjectsModule } from './subjects/subjects.module';
import { InventoryModule } from './inventory/inventory.module';
import { TransportModule } from './transport/transport.module';
import { RouteAssignmentsModule } from './route-assignments/route-assignments.module';
import { HostelModule } from './hostel/hostel.module';
import { RoomAssignmentsModule } from './room-assignments/room-assignments.module';
import { StudentFeesModule } from './student-fees/student-fees.module';
import { FeeStructuresModule } from './fee-structures/fee-structures.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PromotionsModule } from './promotions/promotions.module';
import { BulkNotificationsModule } from './bulk-notifications/bulk-notifications.module';
import { PayrollModule } from './payroll/payroll.module';
import { CertificatesModule } from './certificates/certificates.module';
import { LibraryModule } from './library/library.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { AlumniModule } from './alumni/alumni.module';
import { DisciplineModule } from './discipline/discipline.module';
import { EventsModule } from './events/events.module';
import { HealthRecordsModule } from './health-records/health-records.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { GradesModule } from './grades/grades.module';
import { AttendanceModule } from './attendance/attendance.module';
import { StaffAttendanceModule } from './staff-attendance/staff-attendance.module';
import { ExamAssignmentsModule } from './exam-assignments/exam-assignments.module';
import { ExamMarksModule } from './exam-marks/exam-marks.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { MessagesModule } from './messages/messages.module';
import { BlastsModule } from './blasts/blasts.module';
import { FeePaymentsModule } from './fee-payments/fee-payments.module';
import { RfidModule } from './rfid/rfid.module';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { PreferencesModule } from './preferences/preferences.module';
import { ResourcesModule } from './resources/resources.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.get('REDIS_URL') || 'redis://localhost:6379';

                return {
                    stores: [createKeyv(redisUrl)],
                    ttl: 60000,
                };
            },
            inject: [ConfigService],
        }),
        JwtModule.register({
            secret: process.env.SYSTEM_SECRET,
            signOptions: { expiresIn: '30s' },
        }),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads/',
        }),
        UserModule,
        PrismaModule,
        AuthModule,
        DashboardModule,
        AuditModule,
        UploadModule,
        StudentsModule,
        StaffModule,
        ClassesModule,
        TimetableModule,
        SubjectsModule,
        InventoryModule,
        TransportModule,
        RouteAssignmentsModule,
        HostelModule,
        RoomAssignmentsModule,
        StudentFeesModule,
        FeeStructuresModule,
        ExpensesModule,
        PromotionsModule,
        BulkNotificationsModule,
        PayrollModule,
        CertificatesModule,
        LibraryModule,
        AdmissionsModule,
        AlumniModule,
        DisciplineModule,
        EventsModule,
        HealthRecordsModule,
        LeaveRequestsModule,
        GradesModule,
        AttendanceModule,
        StaffAttendanceModule,
        ExamAssignmentsModule,
        ExamMarksModule,
        AssignmentsModule,
        QuizzesModule,
        MessagesModule,
        BlastsModule,
        FeePaymentsModule,
        RfidModule,
        AppSettingsModule,
        PreferencesModule,
        ResourcesModule,
        PdfModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
