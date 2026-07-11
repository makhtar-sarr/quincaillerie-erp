// Quincaillerie ERP — Tauri command for year-aware sequential numbering.
//
// Generates the next document number for a given prefix (e.g. "FAC" for
// invoices, "DEV" for quotes) using MAX + 1 within the year extracted from the
// provided `date` parameter. The year is taken from the caller, never from the
// system clock, so numbering stays consistent with the document's own date.

use rusqlite::params;

use crate::state::AppState;

/// Extract the 4-digit year from a date string ("YYYY-MM-DD" or similar).
fn extract_year(date: &str) -> Result<String, String> {
    let year = date
        .split('-')
        .next()
        .filter(|y| y.len() == 4 && y.chars().all(|c| c.is_ascii_digit()))
        .ok_or_else(|| format!("Format de date invalide: '{}'", date))?;
    Ok(year.to_string())
}

/// Resolve the table and column that hold numbers for a given prefix.
fn table_for_prefix(prefix: &str) -> Result<&'static str, String> {
    match prefix {
        "FAC" => Ok("invoices"),
        "DEV" => Ok("quotes"),
        other => Err(format!("Préfixe de numérotation inconnu: '{}'", other)),
    }
}

/// Compute the next sequential document number for `prefix` in the year of `date`.
///
/// Returns a string like `FAC-2026-001`. The numeric part is `MAX(existing) + 1`
/// for that year, zero-padded to 3 digits; if no number exists yet it starts at 1.
#[tauri::command]
pub fn get_next_number(
    state: tauri::State<'_, AppState>,
    prefix: String,
    date: String,
) -> Result<String, String> {
    let year = extract_year(&date)?;
    let table = table_for_prefix(&prefix)?;

    // Position (1-indexed) of the first digit after "{prefix}-{year}-".
    let substr_start = (prefix.len() + 1 + year.len() + 1 + 1) as i32;
    let like_pattern = format!("{}-{}-%", prefix, year);

    let conn = state.conn()?;

    let max_num: Option<i64> = conn
        .query_row(
            &format!(
                "SELECT MAX(CAST(SUBSTR(number, ?1) AS INTEGER)) FROM {} WHERE number LIKE ?2",
                table
            ),
            params![substr_start, like_pattern],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let next = max_num.unwrap_or(0) + 1;

    Ok(format!("{}-{}-{}", prefix, year, format!("{:03}", next)))
}
