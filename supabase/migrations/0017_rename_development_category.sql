-- Rename the "Development" category to "Web & Mobile Development".
-- Only the visible name changes; the slug 'development' stays the same, so
-- every freelancer already in this category keeps it.
update public.talent_categories
   set label = 'Web & Mobile Development'
 where slug = 'development' and parent_slug is null;
