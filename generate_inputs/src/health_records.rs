use std::collections::HashMap;

/// Different types of health records supported
#[derive(Debug, Clone)]
pub enum HealthRecordType {
    Vaccination,
    TestResult,
    MedicalClearance,
    ImmunityProof,
}

/// Health record structure
#[derive(Debug, Clone)]
pub struct HealthRecord {
    pub record_type: HealthRecordType,
    pub patient_id: String,
    pub details: String,
    pub date: String,
    pub issuer: String,
}

impl HealthRecord {
    pub fn new(
        record_type: HealthRecordType,
        patient_id: String,
        details: String,
        date: String,
        issuer: String,
    ) -> Self {
        Self {
            record_type,
            patient_id,
            details,
            date,
            issuer,
        }
    }

    /// Format the health record for signing
    pub fn to_signable_string(&self) -> String {
        let type_str = match self.record_type {
            HealthRecordType::Vaccination => "VaxRecord",
            HealthRecordType::TestResult => "TestResult",
            HealthRecordType::MedicalClearance => "MedClearance",
            HealthRecordType::ImmunityProof => "ImmunityProof",
        };

        format!(
            "{}:{}_{}_{}:{}",
            type_str, self.patient_id, self.details, self.date, self.issuer
        )
    }
}

/// Predefined health record templates
pub struct HealthRecordTemplates;

impl HealthRecordTemplates {
    pub fn get_templates() -> HashMap<&'static str, HealthRecord> {
        let mut templates = HashMap::new();

        templates.insert(
            "covid_vaccination",
            HealthRecord::new(
                HealthRecordType::Vaccination,
                "Patient123".to_string(),
                "COVID19_Dose1".to_string(),
                "2025".to_string(),
                "HealthAuthority".to_string(),
            ),
        );

        templates.insert(
            "negative_test",
            HealthRecord::new(
                HealthRecordType::TestResult,
                "Patient456".to_string(),
                "COVID19_Negative".to_string(),
                "2025-09-27".to_string(),
                "TestLab".to_string(),
            ),
        );

        templates.insert(
            "medical_clearance",
            HealthRecord::new(
                HealthRecordType::MedicalClearance,
                "Patient789".to_string(),
                "FitForTravel".to_string(),
                "2025-09-27".to_string(),
                "Doctor_Smith".to_string(),
            ),
        );

        templates.insert(
            "immunity_proof",
            HealthRecord::new(
                HealthRecordType::ImmunityProof,
                "Patient101".to_string(),
                "COVID19_Antibodies".to_string(),
                "2025-09-27".to_string(),
                "ImmunologyLab".to_string(),
            ),
        );

        templates
    }

    pub fn list_available() -> Vec<&'static str> {
        vec![
            "covid_vaccination",
            "negative_test", 
            "medical_clearance",
            "immunity_proof"
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_record_formatting() {
        let record = HealthRecord::new(
            HealthRecordType::Vaccination,
            "TestPatient".to_string(),
            "COVID19_Dose1".to_string(),
            "2025".to_string(),
            "TestAuthority".to_string(),
        );

        let formatted = record.to_signable_string();
        assert_eq!(formatted, "VaxRecord:TestPatient_COVID19_Dose1_2025:TestAuthority");
    }

    #[test]
    fn test_templates_available() {
        let templates = HealthRecordTemplates::get_templates();
        assert!(templates.contains_key("covid_vaccination"));
        assert!(templates.contains_key("negative_test"));
        assert!(templates.contains_key("medical_clearance"));
        assert!(templates.contains_key("immunity_proof"));
    }
}
