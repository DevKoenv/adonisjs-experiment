<template>
  <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
    <Head title="Log in" />

    <form @submit.prevent="submit" class="flex flex-col gap-6">
      <div class="grid gap-6">
        <div class="grid gap-2">
          <Label for="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            autofocus
            :tabindex="1"
            autocomplete="email"
            v-model="form.email"
            placeholder="email@example.com"
          />
          <InputError :message="form.errors.email" />
        </div>

        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            required
            :tabindex="2"
            autocomplete="current-password"
            v-model="form.password"
            placeholder="Password"
          />
          <InputError :message="form.errors.password" />
        </div>
        <div>
          <InputError
            v-if="Object.keys(form.errors).length > 0"
            message="Invalid username or password."
            class="w-full text-center"
          />

          <Button type="submit" class="mt-4 w-full cursor-pointer" :tabindex="4" :disabled="form.processing">
            <LoaderCircle v-if="form.processing" class="h-4 w-4 animate-spin" />
            Log in
          </Button>
        </div>
      </div>

      <div class="text-center text-sm text-muted-foreground">
        Don't have an account?
        <Link :href="$route('register')" :tabindex="5">Sign up</Link>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import InputError from '@/components/InputError.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { Head, useForm, Link } from '@inertiajs/vue3'
import { LoaderCircle } from 'lucide-vue-next'
import { route } from '@izzyjs/route/client'

const form = useForm({
  email: '',
  password: '',
})

const submit = () => {
  form.post(route('login').toString(), {
    onFinish: () => form.reset('password'),
  })
}
</script>
