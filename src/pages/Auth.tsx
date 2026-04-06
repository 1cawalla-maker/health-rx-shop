import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Stethoscope, User, Mail, Lock, ArrowRight, Loader2, Phone, MapPin, FileText } from 'lucide-react';
import { getQuizFromSession, persistQuizToProfile } from '@/services/eligibilityService';
import { AU_TIMEZONE_OPTIONS } from '@/lib/timezones';
import { userPreferencesService } from '@/services/userPreferencesService';
import { userProfileService } from '@/services/userProfileService';
import { validateDob, formatDobForStorage, validateAuPhone } from '@/lib/validation';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
const ahpraSchema = z.string().regex(/^MED\d{10}$/, 'AHPRA number must be MED followed by 10 digits');
const providerSchema = z.string().min(6, 'Provider number must be at least 6 characters');

const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
];

const SPECIALTIES = [
  'General Practitioner',
  'Addiction Medicine Specialist',
  'Respiratory Medicine',
  'Internal Medicine',
  'Psychiatrist',
  'Other',
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userRole, loading, signIn, signUp, resetPassword } = useAuth();
  
  const initialMode = searchParams.get('mode') || 'login';
  const [activeTab, setActiveTab] = useState(initialMode === 'signup' ? 'signup' : 'login');
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [patientQuizCompleted, setPatientQuizCompleted] = useState(false);

  // Patient-specific fields
  const [patientPhone, setPatientPhone] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [dobError, setDobError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [patientTimezone, setPatientTimezone] = useState('Australia/Brisbane');

  // Doctor-specific fields
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorPhoneError, setDoctorPhoneError] = useState('');
  const [ahpraNumber, setAhpraNumber] = useState('');
  const [providerNumber, setProviderNumber] = useState('');
  const [practiceLocation, setPracticeLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctorTimezone, setDoctorTimezone] = useState('Australia/Brisbane');

  useEffect(() => {
    if (loading || !user || !userRole) return;
    if (userRole.status !== 'approved') return;

    // If the user just completed signup, allow a one-time post-signup redirect.
    // This keeps Phase 1 UI flows deterministic (Phase 2 wires real meaning behind the same UI).
    const postSignupRedirect = sessionStorage.getItem('postSignupRedirect');
    if (postSignupRedirect) {
      sessionStorage.removeItem('postSignupRedirect');
      navigate(postSignupRedirect);
      return;
    }

    switch (userRole.role) {
      case 'patient':
        navigate('/patient/dashboard');
        break;
      case 'doctor':
        navigate('/doctor/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    // For patients, the pre-consultation questionnaire must be completed before signup.
    // We treat the quiz result as "complete" when it exists in session storage.
    const refresh = () => setPatientQuizCompleted(!!getQuizFromSession());
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const handlePatientPhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setPatientPhone(digits);
    setPhoneError('');
  };

  const handleDoctorPhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setDoctorPhone(digits);
    setDoctorPhoneError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === 'patient' && !getQuizFromSession()) {
      toast.error('Please complete the questionnaire before creating your account.');
      navigate('/eligibility');
      return;
    }

    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      passwordSchema.parse(password);

      if (selectedRole === 'patient') {
        const patientPhoneErr = validateAuPhone(patientPhone);
        if (patientPhoneErr) {
          setPhoneError(patientPhoneErr);
          return;
        }
        setPhoneError('');

        const dobResult = validateDob(dobDay, dobMonth, dobYear);
        if (!dobResult.valid) {
          setDobError(dobResult.error || 'Invalid date of birth');
          return;
        }
        setDobError('');
      }

      if (selectedRole === 'doctor') {
        const doctorPhoneErr = validateAuPhone(doctorPhone);
        if (doctorPhoneErr) {
          setDoctorPhoneError(doctorPhoneErr);
          return;
        }
        setDoctorPhoneError('');
        ahpraSchema.parse(ahpraNumber);
        providerSchema.parse(providerNumber);
        if (!practiceLocation) throw new Error('Please select your practice location');
        if (!specialty) throw new Error('Please select your specialty');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
      if (err instanceof Error) {
        toast.error(err.message);
        return;
      }
    }

    setIsSubmitting(true);
    
    const { error } = await signUp(email, password, fullName, selectedRole);

    if (error) {
      setIsSubmitting(false);
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists. Please log in instead.');
      } else {
        toast.error(error.message);
      }
      return;
    }

    // If doctor, save additional info
    if (selectedRole === 'doctor') {
      const { data: { user: newUser } } = await supabase.auth.getUser();
      const doctorPhoneE164 = `+61${doctorPhone}`;
      
      if (newUser) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .upsert({
            user_id: newUser.id,
            ahpra_number: ahpraNumber,
            provider_number: providerNumber,
            practice_location: practiceLocation,
            phone: doctorPhoneE164,
            specialties: [specialty],
            is_active: true,
            registration_complete: true
          }, { onConflict: 'user_id' });

        if (doctorError) {
          console.error('Error saving doctor details:', doctorError);
          toast.error(
            `Doctor registration failed: ${doctorError.message || 'doctors table write failed'}${(doctorError as any).code ? ` (code ${(doctorError as any).code})` : ''}`
          );
          setIsSubmitting(false);
          return;
        }

        const { error: profileError } = await supabase
          .from('doctor_profiles')
          .upsert({
            user_id: newUser.id,
            specialty: specialty,
            ahpra_number: ahpraNumber
          }, { onConflict: 'user_id' });

        if (profileError) {
          console.error('Error saving doctor profile:', profileError);
          toast.error(profileError.message || 'Could not finish doctor registration profile.');
          setIsSubmitting(false);
          return;
        }

        await supabase
          .from('profiles')
          .update({ phone: doctorPhoneE164 })
          .eq('user_id', newUser.id);

        try {
          userPreferencesService.setTimezone(newUser.id, doctorTimezone);
        } catch (e) {
          console.warn('Failed to persist timezone preference:', e);
        }
      }
    }

    setIsSubmitting(false);

    if (selectedRole === 'doctor') {
      toast.success('Account created successfully!');
      navigate('/doctor/dashboard');
    } else {
      const { data: { user: newPatientUser } } = await supabase.auth.getUser();
      if (newPatientUser) {
        const storedPhone = `+61${patientPhone}`;
        const storedDob = formatDobForStorage(dobDay, dobMonth, dobYear);
        
        await supabase
          .from('profiles')
          .update({ 
            phone: storedPhone,
            date_of_birth: storedDob
          })
          .eq('user_id', newPatientUser.id);

        // Persist local profile
        userProfileService.upsertProfile(newPatientUser.id, {
          fullName,
          dateOfBirth: storedDob,
          phoneE164: storedPhone,
          timezone: patientTimezone,
        });
          
        try {
          userPreferencesService.setTimezone(newPatientUser.id, patientTimezone);
        } catch (e) {
          console.warn('Failed to persist timezone preference:', e);
        }
          
        await persistQuizToProfile(newPatientUser.id);
      }
      
      const actionParam = searchParams.get('action');
      if (actionParam === 'upload') {
        toast.success('Account created! Now upload your prescription.');
        sessionStorage.setItem('postSignupRedirect', '/patient/upload-prescription');
      } else {
        toast.success('Account created successfully!');
        // Patient signup is allowed only after completing the questionnaire,
        // so the next step is booking.
        sessionStorage.setItem('postSignupRedirect', '/patient/book');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await resetPassword(email);
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent. Please check your inbox.');
      setShowForgotPassword(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Seo
        title="Log In / Sign Up"
        description="Log in or create your NicoPatch account to book a telehealth consultation."
        canonicalPath="/auth"
        ogType="website"
        noIndex
      />
      <section className="py-16 md:py-24 gradient-section">
        <div className="container">
          <div className={`mx-auto ${selectedRole === 'doctor' && activeTab === 'signup' ? 'max-w-lg' : 'max-w-md'}`}>
            <div className="bg-card rounded-2xl border border-border p-8 shadow-elegant">
              {showForgotPassword ? (
                <>
                  <div className="text-center mb-8">
                    <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                      Reset Password
                    </h1>
                    <p className="text-muted-foreground">
                      Enter your email to receive a password reset link.
                    </p>
                  </div>
                  
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="hero" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Back to Login
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold text-foreground mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <Stethoscope className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <span>NicoPatch</span>
                    </Link>
                    <p className="text-muted-foreground">
                      Access your telehealth account
                    </p>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login">Log In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="you@example.com"
                              className="pl-10"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-sm"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot password?
                        </Button>

                        <Button 
                          type="submit" 
                          variant="hero" 
                          className="w-full" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Log In
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        {/* Role Selection */}
                        <div className="space-y-3">
                          <Label>I am a...</Label>
                          <RadioGroup
                            value={selectedRole}
                            onValueChange={(value) => setSelectedRole(value as AppRole)}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="patient" id="patient" />
                              <Label htmlFor="patient" className="font-normal cursor-pointer">
                                Patient
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="doctor" id="doctor" />
                              <Label htmlFor="doctor" className="font-normal cursor-pointer">
                                Doctor
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {selectedRole === 'patient' && !patientQuizCompleted && (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm font-medium text-foreground">Complete the questionnaire first</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Before creating your patient account, please complete the pre-consultation questionnaire.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full mt-3"
                              onClick={() => navigate('/eligibility')}
                            >
                              Start Questionnaire
                            </Button>
                          </div>
                        )}

                        {(selectedRole !== 'patient' || patientQuizCompleted) && (
                          <>
                            {/* Common fields */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="Dr. John Smith"
                              className="pl-10"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="you@example.com"
                              className="pl-10"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Minimum 6 characters
                          </p>
                        </div>

                        {/* Patient-specific fields */}
                        {selectedRole === 'patient' && (
                          <>
                            <div className="pt-2 border-t border-border">
                              <p className="text-sm font-medium text-primary mb-3">
                                Contact & Personal Details
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="patient-phone">Phone Number</Label>
                              <div className="flex items-center gap-2">
                                <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                                  +61
                                </span>
                                <Input
                                  id="patient-phone"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="4xx xxx xxx"
                                  maxLength={9}
                                  value={patientPhone}
                                  onChange={(e) => handlePatientPhoneChange(e.target.value)}
                                  required
                                  className="flex-1"
                                />
                              </div>
                              {phoneError && (
                                <p className="text-xs text-destructive">{phoneError}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Australian mobile number starting with 4
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Date of Birth</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="DD"
                                  maxLength={2}
                                  value={dobDay}
                                  onChange={(e) => { setDobDay(e.target.value.replace(/\D/g, '').slice(0, 2)); setDobError(''); }}
                                  required
                                />
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="MM"
                                  maxLength={2}
                                  value={dobMonth}
                                  onChange={(e) => { setDobMonth(e.target.value.replace(/\D/g, '').slice(0, 2)); setDobError(''); }}
                                  required
                                />
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="YYYY"
                                  maxLength={4}
                                  value={dobYear}
                                  onChange={(e) => { setDobYear(e.target.value.replace(/\D/g, '').slice(0, 4)); setDobError(''); }}
                                  required
                                />
                              </div>
                              {dobError && (
                                <p className="text-xs text-destructive">{dobError}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                You must be at least 18 years old
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Timezone</Label>
                              <Select value={patientTimezone} onValueChange={setPatientTimezone}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                  {AU_TIMEZONE_OPTIONS.map((tz) => (
                                    <SelectItem key={`${tz.value}-${tz.label}`} value={tz.value}>
                                      {tz.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {/* Doctor-specific fields */}
                        {selectedRole === 'doctor' && (
                          <>
                            <div className="pt-2 border-t border-border">
                              <p className="text-sm font-medium text-primary mb-3">
                                Professional Details
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="doctor-phone">Phone Number</Label>
                              <div className="flex items-center gap-2">
                                <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                                  +61
                                </span>
                                <Input
                                  id="doctor-phone"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="4xx xxx xxx"
                                  maxLength={9}
                                  value={doctorPhone}
                                  onChange={(e) => handleDoctorPhoneChange(e.target.value)}
                                  required
                                  className="flex-1"
                                />
                              </div>
                              {doctorPhoneError && (
                                <p className="text-xs text-destructive">{doctorPhoneError}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Australian mobile number starting with 4
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="ahpra">AHPRA Number</Label>
                                <div className="relative">
                                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="ahpra"
                                    placeholder="MED0001234567"
                                    className="pl-10"
                                    value={ahpraNumber}
                                    onChange={(e) => setAhpraNumber(e.target.value.toUpperCase())}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="provider">Provider Number</Label>
                                <Input
                                  id="provider"
                                  placeholder="123456AB"
                                  value={providerNumber}
                                  onChange={(e) => setProviderNumber(e.target.value.toUpperCase())}
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Primary Practice Location</Label>
                              <Select value={practiceLocation} onValueChange={setPracticeLocation}>
                                <SelectTrigger>
                                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <SelectValue placeholder="Select state/territory" />
                                </SelectTrigger>
                                <SelectContent>
                                  {AUSTRALIAN_STATES.map((state) => (
                                    <SelectItem key={state.value} value={state.value}>
                                      {state.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Specialty</Label>
                              <Select value={specialty} onValueChange={setSpecialty}>
                                <SelectTrigger>
                                  <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <SelectValue placeholder="Select specialty" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SPECIALTIES.map((spec) => (
                                    <SelectItem key={spec} value={spec}>
                                      {spec}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Timezone</Label>
                              <Select value={doctorTimezone} onValueChange={setDoctorTimezone}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                  {AU_TIMEZONE_OPTIONS.map((tz) => (
                                    <SelectItem key={`dr-${tz.value}-${tz.label}`} value={tz.value}>
                                      {tz.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        </>
                        )}

                        <Button 
                          type="submit" 
                          variant="hero" 
                          className="w-full" 
                          disabled={isSubmitting || (selectedRole === 'patient' && !patientQuizCompleted)}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
