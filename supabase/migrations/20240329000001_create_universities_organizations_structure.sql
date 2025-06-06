CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fraternity', 'sorority')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, type)
);

CREATE TABLE IF NOT EXISTS university_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(university_id, organization_id)
);

CREATE TABLE IF NOT EXISTS new_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  founded_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(university_id, organization_id, name)
);

INSERT INTO universities (name, location) VALUES
  ('University of California, Los Angeles', 'Los Angeles, CA'),
  ('University of Southern California', 'Los Angeles, CA'),
  ('Stanford University', 'Stanford, CA'),
  ('University of California, Berkeley', 'Berkeley, CA'),
  ('Harvard University', 'Cambridge, MA'),
  ('Yale University', 'New Haven, CT'),
  ('Princeton University', 'Princeton, NJ'),
  ('Columbia University', 'New York, NY'),
  ('University of Pennsylvania', 'Philadelphia, PA'),
  ('Cornell University', 'Ithaca, NY'),
  ('Duke University', 'Durham, NC'),
  ('Northwestern University', 'Evanston, IL'),
  ('University of Chicago', 'Chicago, IL'),
  ('Vanderbilt University', 'Nashville, TN'),
  ('Emory University', 'Atlanta, GA'),
  ('University of Michigan', 'Ann Arbor, MI'),
  ('University of Virginia', 'Charlottesville, VA'),
  ('University of North Carolina at Chapel Hill', 'Chapel Hill, NC'),
  ('Georgia Institute of Technology', 'Atlanta, GA'),
  ('University of Texas at Austin', 'Austin, TX'),
  ('University of Florida', 'Gainesville, FL'),
  ('Florida State University', 'Tallahassee, FL'),
  ('University of Miami', 'Coral Gables, FL'),
  ('University of Georgia', 'Athens, GA'),
  ('Auburn University', 'Auburn, AL'),
  ('University of Alabama', 'Tuscaloosa, AL'),
  ('Louisiana State University', 'Baton Rouge, LA'),
  ('University of Mississippi', 'Oxford, MS'),
  ('Mississippi State University', 'Starkville, MS'),
  ('University of Tennessee', 'Knoxville, TN'),
  ('University of Kentucky', 'Lexington, KY'),
  ('University of South Carolina', 'Columbia, SC'),
  ('Clemson University', 'Clemson, SC'),
  ('Wake Forest University', 'Winston-Salem, NC'),
  ('North Carolina State University', 'Raleigh, NC'),
  ('Virginia Tech', 'Blacksburg, VA'),
  ('James Madison University', 'Harrisonburg, VA'),
  ('University of Maryland', 'College Park, MD'),
  ('Pennsylvania State University', 'University Park, PA'),
  ('Temple University', 'Philadelphia, PA'),
  ('Drexel University', 'Philadelphia, PA'),
  ('Rutgers University', 'New Brunswick, NJ'),
  ('New York University', 'New York, NY'),
  ('Syracuse University', 'Syracuse, NY'),
  ('University at Buffalo', 'Buffalo, NY'),
  ('Boston University', 'Boston, MA'),
  ('Northeastern University', 'Boston, MA'),
  ('University of Connecticut', 'Storrs, CT'),
  ('University of Vermont', 'Burlington, VT'),
  ('University of New Hampshire', 'Durham, NH'),
  ('University of Maine', 'Orono, ME'),
  ('Ohio State University', 'Columbus, OH'),
  ('University of Cincinnati', 'Cincinnati, OH'),
  ('Miami University', 'Oxford, OH'),
  ('Case Western Reserve University', 'Cleveland, OH'),
  ('University of Notre Dame', 'Notre Dame, IN'),
  ('Purdue University', 'West Lafayette, IN'),
  ('Indiana University', 'Bloomington, IN'),
  ('University of Illinois at Urbana-Champaign', 'Champaign, IL'),
  ('DePaul University', 'Chicago, IL'),
  ('University of Wisconsin-Madison', 'Madison, WI'),
  ('Marquette University', 'Milwaukee, WI'),
  ('University of Minnesota', 'Minneapolis, MN'),
  ('University of Iowa', 'Iowa City, IA'),
  ('Iowa State University', 'Ames, IA'),
  ('University of Missouri', 'Columbia, MO'),
  ('Washington University in St. Louis', 'St. Louis, MO'),
  ('University of Kansas', 'Lawrence, KS'),
  ('Kansas State University', 'Manhattan, KS'),
  ('University of Nebraska-Lincoln', 'Lincoln, NE'),
  ('University of Oklahoma', 'Norman, OK'),
  ('Oklahoma State University', 'Stillwater, OK'),
  ('University of Arkansas', 'Fayetteville, AR'),
  ('Texas A&M University', 'College Station, TX'),
  ('Texas Tech University', 'Lubbock, TX'),
  ('University of Houston', 'Houston, TX'),
  ('Rice University', 'Houston, TX'),
  ('Baylor University', 'Waco, TX'),
  ('Texas Christian University', 'Fort Worth, TX'),
  ('Southern Methodist University', 'Dallas, TX'),
  ('University of Denver', 'Denver, CO'),
  ('Colorado State University', 'Fort Collins, CO'),
  ('University of Colorado Boulder', 'Boulder, CO'),
  ('University of Utah', 'Salt Lake City, UT'),
  ('Utah State University', 'Logan, UT'),
  ('Brigham Young University', 'Provo, UT'),
  ('Arizona State University', 'Tempe, AZ'),
  ('University of Arizona', 'Tucson, AZ'),
  ('Northern Arizona University', 'Flagstaff, AZ'),
  ('University of Nevada, Las Vegas', 'Las Vegas, NV'),
  ('University of Nevada, Reno', 'Reno, NV'),
  ('University of New Mexico', 'Albuquerque, NM'),
  ('New Mexico State University', 'Las Cruces, NM'),
  ('University of California, San Diego', 'San Diego, CA'),
  ('University of California, Santa Barbara', 'Santa Barbara, CA'),
  ('University of California, Davis', 'Davis, CA'),
  ('University of California, Irvine', 'Irvine, CA'),
  ('San Diego State University', 'San Diego, CA'),
  ('California State University, Long Beach', 'Long Beach, CA'),
  ('University of Oregon', 'Eugene, OR'),
  ('Oregon State University', 'Corvallis, OR'),
  ('Portland State University', 'Portland, OR'),
  ('University of Washington', 'Seattle, WA'),
  ('Washington State University', 'Pullman, WA'),
  ('Western Washington University', 'Bellingham, WA'),
  ('University of Idaho', 'Moscow, ID'),
  ('Boise State University', 'Boise, ID'),
  ('Montana State University', 'Bozeman, MT'),
  ('University of Montana', 'Missoula, MT'),
  ('University of Wyoming', 'Laramie, WY'),
  ('University of North Dakota', 'Grand Forks, ND'),
  ('North Dakota State University', 'Fargo, ND'),
  ('University of South Dakota', 'Vermillion, SD'),
  ('South Dakota State University', 'Brookings, SD');

INSERT INTO organizations (name, type) VALUES
  ('Chi Psi', 'fraternity'),
  ('Alpha Phi Alpha', 'fraternity'),
  ('Beta Theta Pi', 'fraternity'),
  ('Sigma Chi', 'fraternity'),
  ('Phi Delta Theta', 'fraternity'),
  ('Kappa Alpha Order', 'fraternity'),
  ('Sigma Alpha Epsilon', 'fraternity'),
  ('Lambda Chi Alpha', 'fraternity'),
  ('Tau Kappa Epsilon', 'fraternity'),
  ('Phi Gamma Delta', 'fraternity'),
  ('Alpha Tau Omega', 'fraternity'),
  ('Pi Kappa Alpha', 'fraternity'),
  ('Kappa Sigma', 'fraternity'),
  ('Delta Tau Delta', 'fraternity'),
  ('Phi Kappa Psi', 'fraternity'),
  ('Sigma Nu', 'fraternity'),
  ('Theta Chi', 'fraternity'),
  ('Alpha Epsilon Pi', 'fraternity'),
  ('Zeta Beta Tau', 'fraternity'),
  ('Phi Sigma Kappa', 'fraternity'),
  ('Delta Chi', 'fraternity'),
  ('Sigma Phi Epsilon', 'fraternity'),
  ('Pi Kappa Phi', 'fraternity'),
  ('Kappa Alpha Psi', 'fraternity'),
  ('Omega Psi Phi', 'fraternity'),
  ('Phi Beta Sigma', 'fraternity'),
  ('Iota Phi Theta', 'fraternity'),
  ('Alpha Sigma Phi', 'fraternity'),
  ('Phi Kappa Theta', 'fraternity'),
  ('Theta Delta Chi', 'fraternity'),
  ('Alpha Phi', 'sorority'),
  ('Chi Omega', 'sorority'),
  ('Delta Delta Delta', 'sorority'),
  ('Gamma Phi Beta', 'sorority'),
  ('Kappa Alpha Theta', 'sorority'),
  ('Kappa Delta', 'sorority'),
  ('Kappa Kappa Gamma', 'sorority'),
  ('Pi Beta Phi', 'sorority'),
  ('Alpha Chi Omega', 'sorority'),
  ('Delta Gamma', 'sorority'),
  ('Alpha Delta Pi', 'sorority'),
  ('Alpha Gamma Delta', 'sorority'),
  ('Alpha Omicron Pi', 'sorority'),
  ('Alpha Sigma Alpha', 'sorority'),
  ('Alpha Xi Delta', 'sorority'),
  ('Delta Phi Epsilon', 'sorority'),
  ('Delta Zeta', 'sorority'),
  ('Phi Mu', 'sorority'),
  ('Phi Sigma Sigma', 'sorority'),
  ('Sigma Delta Tau', 'sorority'),
  ('Sigma Kappa', 'sorority'),
  ('Zeta Tau Alpha', 'sorority'),
  ('Alpha Kappa Alpha', 'sorority'),
  ('Delta Sigma Theta', 'sorority'),
  ('Zeta Phi Beta', 'sorority'),
  ('Sigma Gamma Rho', 'sorority'),
  ('Alpha Epsilon Phi', 'sorority'),
  ('Sigma Alpha Iota', 'sorority'),
  ('Theta Phi Alpha', 'sorority'),
  ('Alpha Sigma Tau', 'sorority');

WITH random_assignments AS (
  SELECT 
    u.id as university_id,
    o.id as organization_id,
    ROW_NUMBER() OVER (PARTITION BY u.id, o.type ORDER BY RANDOM()) as rn
  FROM universities u
  CROSS JOIN organizations o
),
filtered_assignments AS (
  SELECT university_id, organization_id
  FROM random_assignments
  WHERE (rn <= 8 AND organization_id IN (SELECT id FROM organizations WHERE type = 'fraternity'))
     OR (rn <= 7 AND organization_id IN (SELECT id FROM organizations WHERE type = 'sorority'))
)
INSERT INTO university_organizations (university_id, organization_id)
SELECT university_id, organization_id FROM filtered_assignments;

WITH chapter_names AS (
  SELECT 
    uo.university_id,
    uo.organization_id,
    o.name as org_name,
    CASE 
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 0 THEN 'Alpha'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 1 THEN 'Beta'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 2 THEN 'Gamma'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 3 THEN 'Delta'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 4 THEN 'Epsilon'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 5 THEN 'Zeta'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 6 THEN 'Eta'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 7 THEN 'Theta'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 8 THEN 'Iota'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 9 THEN 'Kappa'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 10 THEN 'Lambda'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 11 THEN 'Mu'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 12 THEN 'Nu'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 13 THEN 'Xi'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 14 THEN 'Omicron'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 15 THEN 'Pi'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 16 THEN 'Rho'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 17 THEN 'Sigma'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 18 THEN 'Tau'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 19 THEN 'Upsilon'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 20 THEN 'Phi'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 21 THEN 'Chi'
      WHEN ROW_NUMBER() OVER (PARTITION BY uo.organization_id ORDER BY RANDOM()) % 24 = 22 THEN 'Psi'
      ELSE 'Omega'
    END as chapter_letter
  FROM university_organizations uo
  JOIN organizations o ON uo.organization_id = o.id
)
INSERT INTO new_chapters (name, university_id, organization_id)
SELECT 
  org_name || ' - ' || chapter_letter || ' Chapter' as name,
  university_id,
  organization_id
FROM chapter_names;

alter publication supabase_realtime add table universities;
alter publication supabase_realtime add table organizations;
alter publication supabase_realtime add table university_organizations;
alter publication supabase_realtime add table new_chapters;
