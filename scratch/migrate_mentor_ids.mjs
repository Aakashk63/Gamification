import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const supabaseAnonKey = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log("Starting one-time mentor assignment migration...");
  
  // 1. Fetch all mentors to map name -> UUID
  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, students')
    .eq('role', 'mentor');

  if (!mentors) {
    console.error("No mentors found.");
    return;
  }

  const mentorMap = new Map(); // name -> id
  const mentorStudentsMap = new Map(); // id -> Set of student names

  mentors.forEach(m => {
    if (m.full_name) {
      mentorMap.set(m.full_name.trim().toLowerCase(), m.id);
    }
    const currentStudents = Array.isArray(m.students) ? m.students : [];
    mentorStudentsMap.set(m.id, new Set(currentStudents.map(n => n.trim().toLowerCase())));
  });

  // 2. Fetch all students where mentor_id is NULL
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, mentor_name, mentor_id')
    .eq('role', 'student')
    .is('mentor_id', null);

  if (!students || students.length === 0) {
    console.log("No students with NULL mentor_id found.");
    return;
  }

  console.log(`Found ${students.length} students with NULL mentor_id.`);

  for (const student of students) {
    let resolvedMentorId = null;
    let resolvedMentorName = null;

    // Try resolving from student's mentor_name field
    if (student.mentor_name) {
      const matchId = mentorMap.get(student.mentor_name.trim().toLowerCase());
      if (matchId) {
        resolvedMentorId = matchId;
        // Get official casing from the mentor's profile
        const mentorObj = mentors.find(m => m.id === matchId);
        resolvedMentorName = mentorObj?.full_name || student.mentor_name;
      }
    }

    // If still unresolved, try resolving by checking mentor's students JSONB arrays
    if (!resolvedMentorId && student.full_name) {
      const studentNameLower = student.full_name.trim().toLowerCase();
      for (const mentor of mentors) {
        const studentSet = mentorStudentsMap.get(mentor.id);
        if (studentSet && studentSet.has(studentNameLower)) {
          resolvedMentorId = mentor.id;
          resolvedMentorName = mentor.full_name;
          break;
        }
      }
    }

    if (resolvedMentorId) {
      console.log(`Resolving Student "${student.full_name}" -> Mentor "${resolvedMentorName}" (${resolvedMentorId})`);
      
      // Update student profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          mentor_id: resolvedMentorId,
          mentor_name: resolvedMentorName
        })
        .eq('id', student.id);

      if (updateError) {
        console.error(`Failed to update student ${student.full_name}:`, updateError);
      } else {
        // Also ensure student name is in the mentor's students array
        const mentorObj = mentors.find(m => m.id === resolvedMentorId);
        if (mentorObj) {
          let currentStudents = Array.isArray(mentorObj.students) ? mentorObj.students : [];
          if (!currentStudents.some(name => name.trim().toLowerCase() === student.full_name.trim().toLowerCase())) {
            currentStudents.push(student.full_name);
            mentorObj.students = currentStudents; // update local representation
            
            await supabase
              .from('profiles')
              .update({ students: currentStudents })
              .eq('id', resolvedMentorId);
            
            console.log(`Added student "${student.full_name}" to mentor "${resolvedMentorName}" students list.`);
          }
        }
      }
    } else {
      console.log(`Could not safely resolve mentor for student "${student.full_name}" (mentor_name: "${student.mentor_name || 'None'}"). Skipping.`);
    }
  }

  console.log("Migration complete!");
}

run();
