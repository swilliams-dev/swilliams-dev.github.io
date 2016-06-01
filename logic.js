var experience = [];
var excludeCategories = [];
var excludeJobs = [];
var linkedJobIdPerCatId = [];

//Pulls in the JSON and starts drawing tables
$.getJSON("data.json").success(function(response){
	experience = response;
    //Populates the linkedJobIdPerCatId[] to reduce calls to JobIdsLinkedToCategory()
	for(var a = 0; a < experience.category.length; a += 1) { linkedJobIdPerCatId[a] = new JobIdsLinkedToCategory(a); }
	DrawTables();
});

//Returns index of the given Category name
function CatIdFromName(name) {return experience.category.map(function(n){ return n.name; }).indexOf(name);}

//Returns array of Job id's from given Category id
function JobIdsLinkedToCategory(catId) {
	var jobIds = [];
	for(var a = 0; a < experience.job.length; a += 1) {
		for(var b = 0; b < experience.job[a].linked.length; b += 1) {
			var linkCatId = CatIdFromName(experience.job[a].linked[b]);
			if(catId == linkCatId) {jobIds.push(a);}
		}
	}
	return jobIds;
}

//Look for active jobs & categories by category id, and calculate the apropriate allotment of experience.
function CalculateExperiencePerCategory(id) {
	var totalExperience = 0;
	var totalDistributedExperience = 0; 
	for(var a = 0; a < linkedJobIdPerCatId[id].length; a += 1) {
		var activeLinkedCatCount = 0;
		var jobId = linkedJobIdPerCatId[id][a];
		for(var b = 0; b < experience.job[jobId].linked.length; b += 1) {
			var catId = CatIdFromName(experience.job[jobId].linked[b]);
			if(CheckOn(excludeCategories, catId)) {++activeLinkedCatCount;}
		}
		if (CheckOn(excludeJobs, jobId)) {	totalExperience += LengthOfExperience(jobId);
		totalDistributedExperience += LengthOfExperience(jobId)/activeLinkedCatCount; }
	}
	if (CheckOn(excludeCategories, id)) { return totalDistributedExperience; } else { return totalExperience; }
}

//Look for active categories, and calculate by id the appopriate class allotment.
function CalculateClassesPerCategory(id) {
	var totalCountOfClass = 0.0;
	for(var y = 0; y < experience.category[id].linked.length; y += 1) {
		if (CheckOn(excludeCategories, id)) {
			var count = 0;
			for(var i = 0; i < experience.category.length; i += 1) {
				if(CheckOn(excludeCategories, i)) { if( $.inArray(experience.category[id].linked[y], experience.category[i].linked) > -1 )	{ count++; } }
			}
			totalCountOfClass += 1/(count);
		} else { totalCountOfClass = experience.category[id].linked.length; }
	};
	return totalCountOfClass;
}

//Creates HTML from the JSON data for each passed Category id
function DrawCategoryEntry(id) {
	//Reduce the number of calls to the Calculate functions and formats data
	var classCount = Math.round(CalculateClassesPerCategory(id)* 10) / 10;
	var experienceCount = Math.round(CalculateExperiencePerCategory(id)* 10) / 10;
	$("#categories").last().append(
		'<div class="category_entry'+((CheckOn(excludeCategories, id)) ? "" : " inactive")+'">'+
		'<div class="check_container"><input id="'+id+'" class="category_check" type="checkbox"'+((CheckOn(excludeCategories, id)) ? " checked " : "")+' /></div>'+
		'<div class="category_name">'+experience.category[id].name+'</div>'+
		'<div class="category_classes">'+(classCount)+" Class"+(classCount == 1 ? "" : "es")+'</div>'+
		'<div class="category_experience">'+(experienceCount)+" Month"+(experienceCount == 1 ? "" : "s")+'</div>'+
		'<div class ="category_description">'+experience.category[id].description+'</div></div>' );
}

//Creates HTML from the JSON data for each passed Job id
function DrawJobEntry(id) {
	$("#jobs").last().append(
		'<div class="job_entry'+((CheckOn(excludeJobs, id)) ? "" : " inactive")+'"><div class="check_container">'+'<input id="'+id+'" class="job_check" type="checkbox"'+((CheckOn(excludeJobs, id)) ? " checked " : "")+' /></div>'+	
		'<div class="job_name">'+experience.job[id].name+'</div>'+
		'<div class="job_date">'+experience.job[id].startDate+' - '+experience.job[id].endDate+'</div>'+
		'<div class="job_title">'+experience.job[id].title+'</div>'+
		'<div class="job_location">'+experience.job[id].location+'</div>'+
		'<div class="job_description">'+experience.job[id].description+'</div></div>' );
}

//Creates HTML from the JSON data for each passed Education id
function DrawEducationEntry(id) {
	$("#education").last().append(
		'<div class="education_entry'+((experience.education[id].type == "degree") ? ' degree">' : '">')+
			'<div class="education_org"><div>'+experience.education[id].org+'</div></div>'+
			'<div class="education_name"><div>'+experience.education[id].name+'</div></div>'+
			'<div class="education_year"><div>'+experience.education[id].year+'</div></div>'+
			((experience.education[id].type == "degree") ? ('<div class="education_major"><div>'+experience.education[id].major+'</div></div>') : "")+
			((experience.education[id].type == "degree") ? ('<div class="education_gpa"><div> GPA: '+experience.education[id].gpa+'</div></div></div>') : ""));
}

//Main function
function DrawTables() {
	$(".redraw").children().not('.header').remove(); //$(".redraw").children().remove(); // alt: 
	//Iterate through all of the categories listed in JSON, and create the entry
	for(var x = 0; x < experience.category.length; x += 1) { DrawCategoryEntry(x); };
	for(var x = 0; x < experience.job.length; x += 1) { DrawJobEntry(x); };	
	for(var x = 0; x < experience.education.length; x += 1) {DrawEducationEntry(x); };	
	//Watch for changes, make the changes, then redraw via CheckToggle()
	$('.category_entry').on('click', function() { CheckToggle(excludeCategories, parseInt($(this).find(".category_check").attr('id'))); });
	$('.job_entry').on('click', function() { CheckToggle(excludeJobs, parseInt($(this).find(".job_check").attr('id'))); });
}

//Keeps the arrays updated, and redraw when changes occur above
function CheckToggle(excludeArray, id) {
	if (CheckOn(excludeArray, id)) { excludeArray.push(id) }
	else { excludeArray.splice(excludeArray.indexOf(id), 1); }
	DrawTables();
	excludeArray.sort();
}

//True if an id is NOT excluded from the excludeArray
function CheckOn(excludeArray, id) { return ($.inArray(id, excludeArray) == -1); }

//Job id (index) goes in, months of experience come out
function LengthOfExperience(id) {
	var length = 0;
    for(var x = 0; x < experience.job.length; x += 1) {
		length = (((parseInt(experience.job[id].endDate.split("/")[1]) - 
		parseInt(experience.job[id].startDate.split("/")[1]))*12) -
		parseInt(experience.job[id].startDate.split("/")[0]) +
		parseInt(experience.job[id].endDate.split("/")[0]))
    }
	return length;
}
