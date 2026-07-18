-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "completenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isMatchEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isStale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "matchingBlockers" TEXT[],
ADD COLUMN     "matchingWarnings" TEXT[];

-- CreateTable
CREATE TABLE "ProgramRequirement" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "ieltsMinimum" DOUBLE PRECISION,
    "toeflMinimum" DOUBLE PRECISION,
    "duolingoMinimum" DOUBLE PRECISION,
    "gpaMinimum" DOUBLE PRECISION,
    "languageRequirements" TEXT[],
    "additionalCertificates" TEXT[],
    "workExperienceRequired" INTEGER,
    "requiresUniAssist" BOOLEAN NOT NULL DEFAULT false,
    "requiresAPS" BOOLEAN NOT NULL DEFAULT false,
    "isOpenAdmission" BOOLEAN NOT NULL DEFAULT false,
    "greRequired" BOOLEAN NOT NULL DEFAULT false,
    "gmatRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creditPoints" INTEGER,
    "semester" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramIntake" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "intakeSeason" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3) NOT NULL,
    "confirmationDeadline" TIMESTAMP(3),
    "enrollmentStartDate" TIMESTAMP(3),
    "enrollmentEndDate" TIMESTAMP(3),
    "capacity" INTEGER,
    "capacityReservedInternational" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramFee" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "applicableIntakes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramHistory" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramReview" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'FLAGGED',
    "issues" TEXT[],
    "completenessScore" DOUBLE PRECISION NOT NULL,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramRequirement_courseId_key" ON "ProgramRequirement"("courseId");

-- CreateIndex
CREATE INDEX "ProgramRequirement_courseId_idx" ON "ProgramRequirement"("courseId");

-- CreateIndex
CREATE INDEX "ProgramModule_courseId_semester_idx" ON "ProgramModule"("courseId", "semester");

-- CreateIndex
CREATE INDEX "ProgramIntake_courseId_idx" ON "ProgramIntake"("courseId");

-- CreateIndex
CREATE INDEX "ProgramIntake_applicationDeadline_idx" ON "ProgramIntake"("applicationDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramIntake_courseId_intakeSeason_key" ON "ProgramIntake"("courseId", "intakeSeason");

-- CreateIndex
CREATE INDEX "ProgramFee_courseId_feeType_idx" ON "ProgramFee"("courseId", "feeType");

-- CreateIndex
CREATE INDEX "ProgramHistory_courseId_changedAt_idx" ON "ProgramHistory"("courseId", "changedAt");

-- CreateIndex
CREATE INDEX "ProgramHistory_fieldName_idx" ON "ProgramHistory"("fieldName");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramReview_courseId_key" ON "ProgramReview"("courseId");

-- CreateIndex
CREATE INDEX "ProgramReview_reviewStatus_flaggedAt_idx" ON "ProgramReview"("reviewStatus", "flaggedAt");

-- CreateIndex
CREATE INDEX "ProgramReview_completenessScore_idx" ON "ProgramReview"("completenessScore");

-- CreateIndex
CREATE INDEX "Course_completenessScore_isMatchEligible_idx" ON "Course"("completenessScore", "isMatchEligible");

-- CreateIndex
CREATE INDEX "Course_lastVerifiedAt_isStale_idx" ON "Course"("lastVerifiedAt", "isStale");

-- AddForeignKey
ALTER TABLE "ProgramRequirement" ADD CONSTRAINT "ProgramRequirement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramModule" ADD CONSTRAINT "ProgramModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramIntake" ADD CONSTRAINT "ProgramIntake_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramFee" ADD CONSTRAINT "ProgramFee_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramHistory" ADD CONSTRAINT "ProgramHistory_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramReview" ADD CONSTRAINT "ProgramReview_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
