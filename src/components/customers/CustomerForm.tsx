import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Check, X, CheckCircle } from 'lucide-react';
import { customerSchema } from '../../schemas';
import type { Customer, CustomerFormData } from '../../types';
import { storageService } from '../../services/storage.services';
import { useDebounce } from '../../hooks/useDebounce';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { useStore } from '../../store';

interface CustomerFormProps {
  onComplete: () => void;
  editingCustomer?: Customer | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ 
  onComplete, 
  editingCustomer 
}) => {
  const [step, setStep] = useState(1);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCustomer, setSavedCustomer] = useState<Customer | null>(null);
  
  // Zustand actions
  const { addCustomer, updateCustomer } = useStore();
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    trigger, 
    formState: { errors }, 
    setError, 
    clearErrors 
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    mode: 'onChange',
    defaultValues: editingCustomer || {
      personalInfo: { name: '', email: '', phone: '' },
      billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
      shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
      sameAsShipping: false
    }
  });

  const watchSameAsShipping = watch('sameAsShipping');
  const watchEmail = watch('personalInfo.email');
  const debouncedEmail = useDebounce(watchEmail, 500);

  // Copy billing to shipping address
  useEffect(() => {
    if (watchSameAsShipping) {
      const billingAddress = watch('billingAddress');
      setValue('shippingAddress', billingAddress);
      trigger('shippingAddress');
    }
  }, [watchSameAsShipping, watch, setValue, trigger]);

  // Async email validation
  useEffect(() => {
    const checkEmail = async () => {
      if (debouncedEmail && debouncedEmail.includes('@')) {
        setCheckingEmail(true);
        try {
          const exists = await storageService.checkEmailExists(
            debouncedEmail, 
            editingCustomer?.id
          );
          
          if (exists) {
            setError('personalInfo.email', { 
              type: 'manual',
              message: 'Email already exists' 
            });
          } else {
            clearErrors('personalInfo.email');
          }
        } catch (error) {
          console.error('Error checking email:', error);
        } finally {
          setCheckingEmail(false);
        }
      }
    };
    
    checkEmail();
  }, [debouncedEmail, setError, clearErrors, editingCustomer]);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['personalInfo.name', 'personalInfo.email', 'personalInfo.phone'];
    } else if (step === 2) {
      fieldsToValidate = [
        'billingAddress.street', 'billingAddress.city', 'billingAddress.state',
        'billingAddress.zipCode', 'billingAddress.country'
      ];
      
      if (!watchSameAsShipping) {
        fieldsToValidate.push(
          'shippingAddress.street', 'shippingAddress.city', 'shippingAddress.state',
          'shippingAddress.zipCode', 'shippingAddress.country'
        );
      }
    }
    
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid && !errors.personalInfo?.email) {
      if (step === 2) {
        // Submit the form when moving from step 2 to 3
        handleSubmit(onSubmit)();
      } else {
        setStep(step + 1);
      }
    }
  };

  const previousStep = () => {
    if (step > 1 && step < 3) {
      setStep(step - 1);
    }
  };

  const handleCancel = () => {
    if (savedCustomer || window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      onComplete();
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      const customer: Customer = {
        id: editingCustomer?.id || Date.now().toString(),
        ...data,
        createdAt: editingCustomer?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      if (editingCustomer) {
        await updateCustomer(customer.id, customer);
      } else {
        await addCustomer(customer);
      }
      
      setSavedCustomer(customer);
      setStep(3);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h3>
            <Input
              label="Full Name"
              {...register('personalInfo.name')}
              error={errors.personalInfo?.name?.message}
            />
            <div className="relative">
              <Input
                label="Email Address"
                type="email"
                {...register('personalInfo.email')}
                error={errors.personalInfo?.email?.message}
              />
              {checkingEmail && (
                <div className="absolute right-3 top-9">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <Input
              label="Phone Number (Optional)"
              {...register('personalInfo.phone')}
              error={errors.personalInfo?.phone?.message}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Billing Address
              </h3>
              <div className="space-y-4">
                <Input
                  label="Street Address"
                  {...register('billingAddress.street')}
                  error={errors.billingAddress?.street?.message}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    {...register('billingAddress.city')}
                    error={errors.billingAddress?.city?.message}
                  />
                  <Input
                    label="State"
                    {...register('billingAddress.state')}
                    error={errors.billingAddress?.state?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ZIP Code"
                    {...register('billingAddress.zipCode')}
                    error={errors.billingAddress?.zipCode?.message}
                  />
                  <Input
                    label="Country"
                    {...register('billingAddress.country')}
                    error={errors.billingAddress?.country?.message}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Shipping Address
                </h3>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register('sameAsShipping')}
                  />
                  <span>Same as billing</span>
                </label>
              </div>
              <div className={`space-y-4 ${watchSameAsShipping ? 'opacity-50 pointer-events-none' : ''}`}>
                <Input
                  label="Street Address"
                  {...register('shippingAddress.street')}
                  error={errors.shippingAddress?.street?.message}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    {...register('shippingAddress.city')}
                    error={errors.shippingAddress?.city?.message}
                  />
                  <Input
                    label="State"
                    {...register('shippingAddress.state')}
                    error={errors.shippingAddress?.state?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ZIP Code"
                    {...register('shippingAddress.zipCode')}
                    error={errors.shippingAddress?.zipCode?.message}
                  />
                  <Input
                    label="Country"
                    {...register('shippingAddress.country')}
                    error={errors.shippingAddress?.country?.message}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        if (!savedCustomer) return null;
        
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Customer {editingCustomer ? 'Updated' : 'Created'} Successfully!
              </h3>
              <p className="text-gray-600">
                {savedCustomer.personalInfo.name} has been {editingCustomer ? 'updated' : 'added'} to your customer list.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
              <h4 className="font-medium text-gray-900 mb-3">Customer Details:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer ID:</span>
                  <span className="font-medium">{savedCustomer.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{savedCustomer.personalInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{savedCustomer.personalInfo.email}</span>
                </div>
                {savedCustomer.personalInfo.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{savedCustomer.personalInfo.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <p className="text-sm text-gray-600">What would you like to do next?</p>
              <div className="flex justify-center space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    // Reset form for new customer
                    window.location.reload();
                  }}
                >
                  Add Another Customer
                </Button>
                <Button
                  type="button"
                  onClick={onComplete}
                >
                  Back to Customer List
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {step < 3 && (
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Cancel and go back"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 3 ? 'Success!' : (editingCustomer ? 'Edit Customer' : 'Add New Customer')}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i === step
                    ? i === 3 ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                    : i < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i < step || (i === 3 && step === 3) ? <Check className="w-4 h-4" /> : i}
              </div>
            ))}
          </div>
        </div>
      </div>

      {step < 3 ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent()}

          <div className="flex justify-between mt-6">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={previousStep}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1 inline" />
                Previous
              </Button>
              {step === 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
            
            <Button 
              type="button" 
              onClick={nextStep}
              loading={step === 2 && isSubmitting}
            >
              {step === 2 ? (editingCustomer ? 'Update Customer' : 'Create Customer') : 'Next'}
              {step < 2 && <ChevronRight className="w-4 h-4 ml-1 inline" />}
            </Button>
          </div>
        </form>
      ) : (
        renderStepContent()
      )}
    </div>
  );
};