import { getApplicantProfile } from "@/app/actions/recruitment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, GraduationCap, Clock, BookOpen, AlertCircle, Edit2, CreditCard, ChevronRight, MessageSquare, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ApplicantActions } from "./_components/ApplicantActions";
import { AssignSessionDialog } from "./_components/AssignSessionDialog";
import { formatDistanceToNow } from "date-fns";

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
    case "PENDING_PAYMENT":
      return <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-50">{status.replace(/_/g, " ")}</Badge>;
    case "APPLICATION_SUBMITTED":
    case "UNDER_REVIEW":
      return <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">{status.replace(/_/g, " ")}</Badge>;
    case "AUDITION_INVITED":
    case "AUDITION_CONFIRMED":
    case "AUDITION_ATTENDED":
      return <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-50">{status.replace(/_/g, " ")}</Badge>;
    case "SHORTLISTED":
    case "SELECTED":
      return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">{status.replace(/_/g, " ")}</Badge>;
    case "REJECTED":
      return <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50">{status.replace(/_/g, " ")}</Badge>;
    case "HIRED":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">{status.replace(/_/g, " ")}</Badge>;
    default:
      return <Badge variant="secondary">{status.replace(/_/g, " ")}</Badge>;
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default async function ApplicantProfilePage({ params }: { params: Promise<{ applicantId: string }> }) {
  const resolvedParams = await params;
  const result = await getApplicantProfile(resolvedParams.applicantId);
  
  if (result.error || !result.applicant) return notFound();

  const { applicant } = result;
  
  let previousRoles = [];
  try {
    previousRoles = JSON.parse(applicant.previousRoles as string) || [];
  } catch (e) {}

  const firstName = applicant.fullName.split(' ')[0];

  const averageScore = applicant.auditionScores.length > 0 
    ? Math.round(applicant.auditionScores.reduce((acc: number, curr: any) => acc + curr.totalScore, 0) / applicant.auditionScores.length)
    : null;

  return (
    <div className="max-w-7xl mx-auto py-4 animate-in fade-in duration-500">
      <div className="mb-6">
        <Link href="/admin/recruitment">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 -ml-3">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-[320px] shrink-0 border-r border-slate-100 pr-8">
          
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center pb-8 border-b border-slate-100">
            <div className="w-24 h-24 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-3xl font-bold mb-4 shadow-sm relative">
              {getInitials(applicant.fullName)}
              {applicant.status === 'HIRED' && (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{applicant.fullName}</h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 justify-center">
              <MapPin className="w-3.5 h-3.5" /> {applicant.townCity}, {applicant.region}
            </p>
          </div>

          {/* Contact Info */}
          <div className="py-6 border-b border-slate-100">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-4 flex justify-between items-center">
              Contacts <Edit2 className="w-3 h-3 text-[#E87154] cursor-pointer" />
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-slate-900">{applicant.phoneNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">WhatsApp</p>
                <p className="text-sm font-medium text-slate-900">{applicant.whatsappNumber || applicant.phoneNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">E-mail</p>
                <p className="text-sm font-medium text-slate-900 break-all">{applicant.email || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Demographics & Education */}
          <div className="py-6 border-b border-slate-100">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-4 flex justify-between items-center">
              Profile <Edit2 className="w-3 h-3 text-[#E87154] cursor-pointer" />
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Age</p>
                  <p className="text-sm font-medium text-slate-900">{applicant.age} yrs</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Gender</p>
                  <p className="text-sm font-medium text-slate-900">{applicant.gender.charAt(0) + applicant.gender.slice(1).toLowerCase()}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Highest Education</p>
                <p className="text-sm font-medium text-slate-900">{applicant.highestEducation}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="py-6">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-4 flex justify-between items-center">
              Payment details
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">Application Fee</span>
                </div>
                <Badge variant="outline" className={applicant.paymentStatus === "PAID" ? "bg-green-50 text-green-700 border-none font-bold" : "bg-amber-50 text-amber-700 border-none font-bold"}>
                  {applicant.paymentStatus}
                </Badge>
              </div>
              {applicant.paymentStatus === "PAID" && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-mono">{applicant.paymentReference}</span>
                  <span className="text-xs font-bold text-slate-900">GHC 100.00</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Management */}
          <div className="py-6">
            <ApplicantActions applicantId={applicant.applicantId} currentStatus={applicant.status} internalNotes={applicant.internalNotes} />
          </div>

        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Reviewing {firstName}</h1>
              <p className="text-sm text-slate-500 font-medium">Applicant ID: <span className="font-mono text-[#E87154]">{applicant.applicantId}</span></p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(applicant.status)}
            </div>
          </div>

          {/* Stat Blocks Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {/* Card 1: Applied Date */}
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 rounded-bl-full transition-transform group-hover:scale-110" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Applied</p>
              <p className="text-xl font-bold text-slate-900">{format(new Date(applicant.createdAt), "MMM d")}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{formatDistanceToNow(new Date(applicant.createdAt))} ago</p>
            </div>

            {/* Card 2: Audition Assigment */}
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50 rounded-bl-full transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Audition</p>
                <AssignSessionDialog applicantId={applicant.applicantId} currentSessionId={applicant.auditionSession?.id} currentStatus={applicant.status} />
              </div>
              {applicant.auditionSession ? (
                <>
                  <p className="text-xl font-bold text-slate-900">{format(new Date(applicant.auditionSession.event.date), "MMM d")}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium truncate">{format(new Date(applicant.auditionSession.startTime), "h:mm a")} • {applicant.auditionSession.event.name}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-300">Unassigned</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Pending schedule</p>
                </>
              )}
            </div>

            {/* Card 3: Audition Score */}
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-orange-50 rounded-bl-full transition-transform group-hover:scale-110" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Score</p>
              <p className="text-xl font-bold text-slate-900">
                {averageScore ? averageScore : "—"} <span className="text-sm text-slate-400 font-medium">/ 70</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Based on {applicant.auditionScores.length} review(s)</p>
            </div>

            {/* Card 4: Next Steps */}
            <div className="bg-slate-900 rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-800 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-800 rounded-full opacity-50" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Timeline</p>
              <p className="text-xl font-bold text-white capitalize">{applicant.status.replace(/_/g, " ").toLowerCase()}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1">View history <ChevronRight className="w-3 h-3" /></p>
            </div>
          </div>

          {/* Details Section */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Application Details</h2>
            <Tabs defaultValue="application" className="w-full">
              <TabsList className="w-full justify-start border-b border-slate-100 rounded-none h-auto p-0 bg-transparent mb-6 space-x-8">
                <TabsTrigger value="application" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E87154] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-slate-500 font-medium data-[state=active]:text-slate-900">Form Responses</TabsTrigger>
                <TabsTrigger value="scores" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E87154] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-slate-500 font-medium data-[state=active]:text-slate-900">Audition Scores</TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E87154] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-slate-500 font-medium data-[state=active]:text-slate-900">Status History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="application" className="space-y-8 mt-0 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                {/* Experience */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Experience Overview
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Worked with children?</p>
                      <p className="text-sm font-medium text-slate-900">{applicant.workedWithChildren ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Previous Roles</p>
                      <div className="flex flex-wrap gap-1.5">
                        {previousRoles.map((role: string) => (
                          <Badge key={role} variant="secondary" className="bg-slate-50 text-slate-600 font-medium border border-slate-100 hover:bg-slate-100">{role}</Badge>
                        ))}
                      </div>
                    </div>
                    {applicant.workedWithChildren && applicant.childrenExperienceDesc && (
                      <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Experience Details</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{applicant.childrenExperienceDesc}</p>
                      </div>
                    )}
                    {applicant.relevantExperience && (
                      <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Other Relevant Experience</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{applicant.relevantExperience}</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="w-full h-px bg-slate-100" />

                {/* Communication */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Communication & Facilitation
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Group Speaking Comfort</p>
                      <p className="text-sm font-medium text-slate-900">{applicant.groupSpeakingComfort.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Led Group Activity?</p>
                      <p className="text-sm font-medium text-slate-900">{applicant.ledGroupActivity ? "Yes" : "No"}</p>
                    </div>
                    {applicant.ledGroupActivity && applicant.groupActivityDesc && (
                      <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Activity Details</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{applicant.groupActivityDesc}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-2">What makes learning fun for children?</p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{applicant.whatMakesLearningFun}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-2">Skills to engage a group of children:</p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{applicant.engagementSkills}</p>
                    </div>
                  </div>
                </section>

                <div className="w-full h-px bg-slate-100" />

                {/* Short Answers */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Written Answers
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-2">Why become a Facilitator?</p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{applicant.whyFacilitator}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-2">Strengths brought to role:</p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{applicant.strengths}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-2">Problem-solving example:</p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{applicant.problemSolvingExample}</p>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="scores" className="mt-0">
                {applicant.auditionScores.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No audition scores recorded yet.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {applicant.auditionScores.map((score: any) => (
                      <div key={score.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 border-b border-slate-200 py-4 px-5">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Evaluator</p>
                              <h4 className="text-sm font-bold text-slate-900">{score.evaluatorName}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">{format(new Date(score.createdAt), "MMM d, yyyy h:mm a")}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black text-[#E87154]">{score.totalScore}<span className="text-sm text-slate-400 font-medium">/70</span></p>
                            </div>
                          </div>
                        </div>
                        <div className="p-0">
                          <table className="w-full text-sm text-left">
                            <tbody>
                              <tr className="border-b border-slate-100"><th className="p-3 font-medium text-slate-600">Reading Ability</th><td className="p-3 font-mono font-bold text-slate-900 text-right">{score.readingAbility}/10</td></tr>
                              <tr className="border-b border-slate-100"><th className="p-3 font-medium text-slate-600 bg-slate-50">Storytelling</th><td className="p-3 font-mono font-bold text-slate-900 text-right bg-slate-50">{score.storytellingAbility}/10</td></tr>
                              <tr className="border-b border-slate-100"><th className="p-3 font-medium text-slate-600">Child Engagement</th><td className="p-3 font-mono font-bold text-slate-900 text-right">{score.childEngagement}/10</td></tr>
                              <tr className="border-b border-slate-100"><th className="p-3 font-medium text-slate-600 bg-slate-50">Communication</th><td className="p-3 font-mono font-bold text-slate-900 text-right bg-slate-50">{score.communicationSkills}/10</td></tr>
                              <tr className="border-b border-slate-100"><th className="p-3 font-medium text-slate-600">Confidence</th><td className="p-3 font-mono font-bold text-slate-900 text-right">{score.confidence}/10</td></tr>
                              <tr className="border-b border-slate-100"><th className="p-3 font-medium text-slate-600 bg-slate-50">Improvisation</th><td className="p-3 font-mono font-bold text-slate-900 text-right bg-slate-50">{score.improvisation}/10</td></tr>
                              <tr><th className="p-3 font-bold text-slate-900 uppercase text-xs tracking-wider">Recommendation</th><td className="p-3 font-mono font-bold text-[#E87154] text-right">{score.overallRecommendation}/10</td></tr>
                            </tbody>
                          </table>
                          {score.evaluatorNotes && (
                            <div className="p-5 border-t border-slate-200 bg-amber-50/50">
                              <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Evaluator Notes</p>
                              <p className="text-sm italic text-slate-700 leading-relaxed">{score.evaluatorNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="space-y-6 pl-4 border-l-2 border-slate-100 ml-2">
                    {applicant.statusHistory.map((history: any, i: number) => (
                      <div key={history.id} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 bg-white border-2 border-[#E87154] rounded-full"></div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-slate-900">{history.toStatus.replace(/_/g, " ")}</span>
                            <span className="text-xs text-slate-400 font-medium">{format(new Date(history.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                          {history.note && <p className="text-sm text-slate-600 mt-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100 inline-block">{history.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
