## Change

In `src/routes/app.$workspaceSlug.assess.index.tsx`, update the `CourseLibrary` component header:

- Remove the heading "Two courses, one method"
- Remove the eyebrow "COURSE LIBRARY" (already shown in the page header)
- Remove the "{COURSES.length} courses" count badge on the right

Result: the Courses tab renders the course cards grid directly, without the intro header row, so adding more courses later requires no copy changes.

No other files affected.