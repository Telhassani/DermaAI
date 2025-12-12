-- ============================================================================
-- DermAI Supabase Migration
-- Creates all tables with profiles linked to auth.users
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'DOCTOR', 'SECRETARY', 'ASSISTANT');

-- Patient enums
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE identification_type AS ENUM ('cin', 'passport');

-- Appointment enums
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE appointment_type AS ENUM ('consultation', 'follow_up', 'procedure', 'emergency');

-- AI Analysis enums
CREATE TYPE analysis_type AS ENUM ('IMAGE', 'LAB_RESULT', 'COMBINED');
CREATE TYPE ai_provider AS ENUM ('CLAUDE', 'OPENAI', 'CUSTOM');
CREATE TYPE severity AS ENUM ('BENIGN', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL', 'UNKNOWN');
CREATE TYPE analysis_status AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'MODIFIED');
CREATE TYPE audit_action AS ENUM ('CREATED', 'VIEWED', 'ACCEPTED', 'REJECTED', 'MODIFIED', 'DELETED');

-- Lab conversation enums
CREATE TYPE message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE message_type AS ENUM ('TEXT', 'FILE', 'ANALYSIS', 'ERROR');
CREATE TYPE attachment_type AS ENUM ('LAB_RESULT', 'IMAGE', 'PDF', 'OTHER');

-- ============================================================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'DOCTOR',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_deleted ON profiles(is_deleted);

-- ============================================================================
-- PATIENTS TABLE
-- ============================================================================

CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    identification_type identification_type NOT NULL,
    identification_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'France',
    insurance_number TEXT,
    allergies TEXT,
    medical_history TEXT,
    doctor_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- Create indexes for patients
CREATE INDEX idx_patients_identification ON patients(identification_number);
CREATE INDEX idx_patients_first_name ON patients(first_name);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_patients_is_deleted ON patients(is_deleted);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type appointment_type NOT NULL DEFAULT 'consultation',
    status appointment_status NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    diagnosis TEXT,
    is_first_visit BOOLEAN NOT NULL DEFAULT false,
    reminder_sent BOOLEAN NOT NULL DEFAULT false,
    recurrence_rule JSONB,
    recurring_series_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- Create indexes for appointments
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_recurring_series_id ON appointments(recurring_series_id);
CREATE INDEX idx_appointments_is_deleted ON appointments(is_deleted);

-- ============================================================================
-- CONSULTATIONS TABLE
-- ============================================================================

CREATE TABLE consultations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consultation_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chief_complaint TEXT NOT NULL,
    symptoms TEXT,
    duration_symptoms TEXT,
    medical_history_notes TEXT,
    clinical_examination TEXT,
    dermatological_examination TEXT,
    lesion_type TEXT,
    lesion_location TEXT,
    lesion_size TEXT,
    lesion_color TEXT,
    lesion_texture TEXT,
    diagnosis TEXT,
    differential_diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    notes TEXT,
    private_notes TEXT,
    images_taken BOOLEAN DEFAULT false,
    biopsy_performed BOOLEAN DEFAULT false,
    biopsy_results TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- Create indexes for consultations
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date);
CREATE INDEX idx_consultations_is_deleted ON consultations(is_deleted);

-- ============================================================================
-- PRESCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER NOT NULL REFERENCES consultations(id),
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    control_date DATE,
    medications JSONB NOT NULL,
    instructions TEXT,
    notes TEXT,
    is_printed BOOLEAN DEFAULT false,
    is_delivered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- Create indexes for prescriptions
CREATE INDEX idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date);
CREATE INDEX idx_prescriptions_is_deleted ON prescriptions(is_deleted);

-- ============================================================================
-- PRESCRIPTION MEDICATIONS TABLE (alternative to JSON)
-- ============================================================================

CREATE TABLE prescription_medications (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    duration TEXT,
    quantity TEXT,
    frequency TEXT,
    route TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_prescription_medications_prescription_id ON prescription_medications(prescription_id);

-- ============================================================================
-- CONSULTATION IMAGES TABLE
-- ============================================================================

CREATE TABLE consultation_images (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER REFERENCES consultations(id),
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
    image_data TEXT NOT NULL,
    notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_consultation_images_consultation_id ON consultation_images(consultation_id);
CREATE INDEX idx_consultation_images_patient_id ON consultation_images(patient_id);
CREATE INDEX idx_consultation_images_uploaded_at ON consultation_images(uploaded_at);
CREATE INDEX idx_consultation_images_is_deleted ON consultation_images(is_deleted);

-- ============================================================================
-- AI ANALYSES TABLE
-- ============================================================================

CREATE TABLE ai_analyses (
    id SERIAL PRIMARY KEY,
    analysis_type analysis_type NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    consultation_id INTEGER REFERENCES consultations(id),
    ai_provider ai_provider DEFAULT 'CLAUDE',
    ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    input_data JSONB,
    prompt_template TEXT,
    primary_diagnosis TEXT,
    differential_diagnoses JSONB,
    confidence_score FLOAT,
    severity severity DEFAULT 'UNKNOWN',
    clinical_findings JSONB,
    recommendations JSONB,
    reasoning TEXT,
    key_features_identified JSONB,
    risk_factors JSONB,
    lab_values_extracted JSONB,
    abnormal_values JSONB,
    reference_ranges JSONB,
    status analysis_status DEFAULT 'PENDING',
    doctor_feedback TEXT,
    doctor_modified_diagnosis TEXT,
    feedback_rating INTEGER,
    reviewed_at TIMESTAMPTZ,
    is_flagged_for_review BOOLEAN DEFAULT false,
    flagged_reason TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_analyses_patient_id ON ai_analyses(patient_id);
CREATE INDEX idx_ai_analyses_doctor_id ON ai_analyses(doctor_id);
CREATE INDEX idx_ai_analyses_consultation_id ON ai_analyses(consultation_id);
CREATE INDEX idx_ai_analyses_status ON ai_analyses(status);
CREATE INDEX idx_ai_analyses_is_deleted ON ai_analyses(is_deleted);

-- ============================================================================
-- AI ANALYSIS IMAGES TABLE
-- ============================================================================

CREATE TABLE ai_analysis_images (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES ai_analyses(id),
    image_path TEXT NOT NULL,
    regions_of_interest JSONB,
    image_findings TEXT,
    confidence_for_this_image FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_analysis_images_analysis_id ON ai_analysis_images(analysis_id);

-- ============================================================================
-- AI ANALYSIS AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE ai_analysis_audit_logs (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES ai_analyses(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    action audit_action NOT NULL,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_analysis_audit_logs_analysis_id ON ai_analysis_audit_logs(analysis_id);
CREATE INDEX idx_ai_analysis_audit_logs_user_id ON ai_analysis_audit_logs(user_id);

-- ============================================================================
-- LAB CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE lab_conversations (
    id SERIAL PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL DEFAULT 'New Lab Analysis Chat',
    description TEXT,
    default_model TEXT,
    system_prompt TEXT,
    temperature FLOAT DEFAULT 0.7,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    title_auto_generated BOOLEAN NOT NULL DEFAULT false,
    original_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_conversations_doctor_id ON lab_conversations(doctor_id);

-- ============================================================================
-- LAB MESSAGES TABLE
-- ============================================================================

CREATE TABLE lab_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES lab_conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    message_type message_type DEFAULT 'TEXT',
    content TEXT NOT NULL,
    model_used TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    processing_time_ms INTEGER,
    has_attachments BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    current_version_number INTEGER NOT NULL DEFAULT 1,
    has_versions BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_messages_conversation_id ON lab_messages(conversation_id);
CREATE INDEX idx_lab_messages_created_at ON lab_messages(created_at);

-- ============================================================================
-- LAB MESSAGE ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE lab_message_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES lab_messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type attachment_type NOT NULL,
    mime_type TEXT,
    is_processed BOOLEAN DEFAULT false,
    extracted_data JSONB,
    ai_analysis_id INTEGER REFERENCES ai_analyses(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_message_attachments_message_id ON lab_message_attachments(message_id);

-- ============================================================================
-- LAB MESSAGE VERSIONS TABLE
-- ============================================================================

CREATE TABLE lab_message_versions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES lab_messages(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    model_used TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    processing_time_ms INTEGER,
    is_current BOOLEAN NOT NULL DEFAULT false,
    regeneration_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, version_number)
);

CREATE INDEX idx_lab_message_versions_message_id ON lab_message_versions(message_id);
CREATE INDEX idx_lab_message_versions_is_current ON lab_message_versions(is_current);

-- ============================================================================
-- PROMPT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE prompt_templates (
    id SERIAL PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT,
    title TEXT NOT NULL,
    template_text TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_templates_doctor_id ON prompt_templates(doctor_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_is_active ON prompt_templates(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_message_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- For now, allow authenticated users to access all data (simplify for development)
-- In production, you'd want more restrictive policies

CREATE POLICY "Authenticated users can access patients" ON patients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access appointments" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access consultations" ON consultations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access prescriptions" ON prescriptions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access prescription_medications" ON prescription_medications
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access consultation_images" ON consultation_images
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access ai_analyses" ON ai_analyses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access ai_analysis_images" ON ai_analysis_images
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access ai_analysis_audit_logs" ON ai_analysis_audit_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access lab_conversations" ON lab_conversations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access lab_messages" ON lab_messages
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access lab_message_attachments" ON lab_message_attachments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access lab_message_versions" ON lab_message_versions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access prompt_templates" ON prompt_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'DOCTOR'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescription_medications_updated_at BEFORE UPDATE ON prescription_medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_images_updated_at BEFORE UPDATE ON consultation_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON ai_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_analysis_images_updated_at BEFORE UPDATE ON ai_analysis_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_analysis_audit_logs_updated_at BEFORE UPDATE ON ai_analysis_audit_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_conversations_updated_at BEFORE UPDATE ON lab_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_messages_updated_at BEFORE UPDATE ON lab_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
